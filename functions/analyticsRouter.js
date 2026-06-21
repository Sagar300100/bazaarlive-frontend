import express from "express";

// Mocked analytics payload to unblock the frontend until real data is wired.
function buildMockDashboard(range = "7d") {
  // These can later be replaced with DB aggregates.
  const stats = [
    { label: "Total Sales (7d)", value: "₹2,45,800", delta: "+12%", trend: "up" },
    { label: "Orders (7d)", value: "182", delta: "+9%", trend: "up" },
    { label: "Avg Order Value", value: "₹1,350", delta: "+4%", trend: "up" },
    { label: "Live Conversion", value: "3.4%", delta: "-0.2%", trend: "down" },
  ];

  const revenueBars = [
    { label: "Mon", value: 22 },
    { label: "Tue", value: 18 },
    { label: "Wed", value: 34 },
    { label: "Thu", value: 28 },
    { label: "Fri", value: 42 },
    { label: "Sat", value: 52 },
    { label: "Sun", value: 39 },
  ];

  const traffic = [
    { label: "Direct", value: 42 },
    { label: "Instagram", value: 28 },
    { label: "YouTube", value: 16 },
    { label: "WhatsApp", value: 9 },
    { label: "Other", value: 5 },
  ];

  const topProducts = [
    { name: "Handwoven Silk Saree", units: 68, revenue: "₹88,400" },
    { name: "Streetwear Hoodie", units: 52, revenue: "₹44,200" },
    { name: "Minimalist Sneakers", units: 39, revenue: "₹35,100" },
    { name: "Copper Bottle Set", units: 31, revenue: "₹18,900" },
  ];

  const sessions = [
    { title: "Festive Flash Sale", viewers: 820, peak: 1420, conversion: 3.9 },
    { title: "Streetwear Drop", viewers: 610, peak: 980, conversion: 3.1 },
    { title: "Home Finds Live", viewers: 455, peak: 720, conversion: 2.5 },
  ];

  return { range, stats, revenueBars, traffic, topProducts, sessions };
}

const router = express.Router();

// GET /api/analytics/dashboard?range=7d
router.get("/dashboard", (req, res) => {
  const range = typeof req.query.range === "string" ? req.query.range : "7d";
  const payload = buildMockDashboard(range);
  return res.json(payload);
});

export default router;
