// functions/scripts/backfillKycEncryption.js
// ──────────────────────────────────────────────────────────────
// One-off migration.
//
// After commit 55b99a8 (KMS-encrypt PAN + bank), NEW writes go to
// pan.panCiphertext / bankAccount.accountCiphertext. Users who
// completed KYC BEFORE that commit still carry:
//   users/{uid}.pan.fullPan               (plaintext PAN)
//   users/{uid}.bankAccount.accountNumber (plaintext account #)
//
// This script:
//   1. Scans every users/{uid} doc
//   2. If pan.fullPan exists: encrypt it → panCiphertext, DELETE fullPan
//   3. If bankAccount.accountNumber exists: encrypt it →
//      accountCiphertext, DELETE accountNumber
//   4. Emits an audit entry per record touched
//   5. Idempotent — safe to run repeatedly; skips already-migrated docs
//
// How to run:
//   Prereq: gcloud installed, authenticated as an owner of the
//   project. From project root:
//
//     gcloud auth application-default login
//     gcloud config set project bazaarlive-78422
//     cd functions
//     node scripts/backfillKycEncryption.js
//
//   The script will print each uid it touched + a final summary.
//   Dry-run mode: set DRY=1 to list what would change without writing.
//     DRY=1 node scripts/backfillKycEncryption.js
// ──────────────────────────────────────────────────────────────

import admin from "firebase-admin";
import { encryptField } from "../kms.js";

const DRY = process.env.DRY === "1";

if (admin.apps.length === 0) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
}
const db = admin.firestore();

async function backfill() {
  console.log(`[backfill] starting${DRY ? " (DRY RUN — no writes)" : ""}`);

  const snap = await db.collection("users").get();
  console.log(`[backfill] scanned ${snap.size} user document(s)`);

  let panMigrated = 0, panSkipped = 0;
  let bankMigrated = 0, bankSkipped = 0;
  let auditWrites = 0;
  let errors = 0;

  for (const doc of snap.docs) {
    const uid = doc.id;
    const data = doc.data() || {};

    const update = {};
    const auditDetails = { uid };

    // ── PAN ──
    const pan = data.pan || {};
    if (pan.fullPan && typeof pan.fullPan === "string") {
      if (pan.panCiphertext) {
        // Both exist — new field takes precedence, remove old plaintext
        update["pan.fullPan"] = admin.firestore.FieldValue.delete();
        panSkipped++;
        auditDetails.pan = "cleared_stale_plaintext";
      } else {
        try {
          const ct = await encryptField(pan.fullPan);
          update["pan.panCiphertext"] = ct;
          update["pan.fullPan"] = admin.firestore.FieldValue.delete();
          panMigrated++;
          auditDetails.pan = "migrated";
        } catch (err) {
          console.error(`  ${uid}: PAN encrypt failed`, err?.message || err);
          errors++;
          continue;
        }
      }
    } else {
      panSkipped++;
    }

    // ── BANK ──
    const bank = data.bankAccount || {};
    if (bank.accountNumber && typeof bank.accountNumber === "string") {
      if (bank.accountCiphertext) {
        update["bankAccount.accountNumber"] = admin.firestore.FieldValue.delete();
        bankSkipped++;
        auditDetails.bank = "cleared_stale_plaintext";
      } else {
        try {
          const ct = await encryptField(bank.accountNumber);
          update["bankAccount.accountCiphertext"] = ct;
          update["bankAccount.accountNumber"] = admin.firestore.FieldValue.delete();
          bankMigrated++;
          auditDetails.bank = "migrated";
        } catch (err) {
          console.error(`  ${uid}: bank encrypt failed`, err?.message || err);
          errors++;
          continue;
        }
      }
    } else {
      bankSkipped++;
    }

    if (Object.keys(update).length > 0) {
      console.log(`  ${uid}: ${Object.keys(update).join(", ")}`);
      if (!DRY) {
        try {
          // update() supports dotted field paths — safe here because we're
          // NOT trying to write nested objects; we're targeting scalar
          // sub-fields and using FieldValue.delete() surgically.
          await doc.ref.update(update);

          // Fire an audit entry per migrated record.
          await db.collection("auditLog").add({
            at: admin.firestore.FieldValue.serverTimestamp(),
            action: "kyc_backfill_encrypted",
            uid: null, // no user actor; this is a system migration
            details: auditDetails,
          });
          auditWrites++;
        } catch (err) {
          console.error(`  ${uid}: firestore update failed`, err?.message || err);
          errors++;
        }
      }
    }
  }

  console.log("");
  console.log("[backfill] summary:");
  console.log(`  PAN  migrated:      ${panMigrated}`);
  console.log(`  PAN  skipped:       ${panSkipped}`);
  console.log(`  Bank migrated:      ${bankMigrated}`);
  console.log(`  Bank skipped:       ${bankSkipped}`);
  console.log(`  Audit entries:      ${auditWrites}`);
  console.log(`  Errors:             ${errors}`);
  console.log(DRY ? "(DRY RUN — nothing was written)" : "(writes committed)");
}

backfill()
  .then(() => { process.exit(0); })
  .catch((err) => {
    console.error("[backfill] fatal", err);
    process.exit(1);
  });
