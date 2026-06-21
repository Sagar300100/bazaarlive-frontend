
export interface FaqArticle {
  title: string;
  slug: string;
  content: string;
}

export interface FaqSection {
  title: string;
  articles: FaqArticle[];
}

export interface FaqCategory {
  title: string;
  sections: FaqSection[];
}

export const faqData: { [key: string]: FaqCategory } = {
  buying: {
    title: 'Buying',
    sections: [
      {
        title: 'Top articles',
        articles: [
          {
            title: 'Pay over time with Buy Now, Pay Later',
            slug: 'pay-over-time',
            content: `
              <p>We partner with leading financial services to offer flexible payment options. During checkout, you may see an option to pay for your purchase in installments. This allows you to get your items now and pay for them over time. Selections are subject to eligibility checks by the provider.</p>
            `
          },
          {
            title: 'How to become a Verified Buyer',
            slug: 'verified-buyer',
            content: `
              <p>To become a Verified Buyer and participate in all streams, you need to verify your identity. This helps keep our community safe. You can do this in your Account Settings by verifying with your Aadhaar number. The process is quick, secure, and unlocks full access to bidding.</p>
            `
          },
          {
            title: 'Bidding on an Item Before It Goes Up For Auction',
            slug: 'pre-bidding',
            content: `
              <p>Some sellers allow pre-bidding on items before the live auction begins. This lets you place a bid in advance. If you are the highest pre-bidder when the item goes live, you will automatically be the leading bidder. It's a great way to participate even if you can't be there for the whole show.</p>
            `
          },
          {
            title: 'Any & All Buyer Protection Policy',
            slug: 'buyer-protection',
            content: `
              <h2>Our Commitment to You</h2>
              <p>We want you to shop with confidence. Our Buyer Protection Policy covers you in case:</p>
              <ul>
                <li>Your item doesn't arrive.</li>
                <li>Your item is significantly not as described by the seller.</li>
                <li>You receive a counterfeit item.</li>
              </ul>
              <p>All branded items are sent to our warehouse for verification first. Our team checks for authenticity and adds a Any & All authentication tag before shipping it to you. Unbranded items also come to our warehouse for a quality check to ensure they meet our standards.</p>
              <p>If you have an issue, please contact support through your purchase history within 3 days of receiving the item.</p>
            `
          },
          {
            title: 'Request to cancel your order as a buyer',
            slug: 'cancel-order',
            content: `
              <p>You can request to cancel an order from your purchase history before the seller has confirmed shipping. Please note that cancellation requests are subject to the seller's approval. Sellers are encouraged to approve requests, but are not obligated to if they have already started the shipping process.</p>
            `
          }
        ]
      },
      {
        title: 'Getting Started',
        articles: [
           {
            title: 'Add and manage payment methods',
            slug: 'manage-payment',
            content: `
              <p>You can add and manage your payment methods, such as UPI, credit/debit cards, and wallets, in the "Payments" section of your Account Settings. Keeping your payment info up-to-date ensures a smooth checkout experience during fast-paced live auctions.</p>
            `
          },
          {
            title: 'Add or update your default shipping address',
            slug: 'manage-address',
            content: `
             <p>Your default shipping address can be managed under the "Addresses" section in your Account Settings. Ensure this is accurate to avoid any delays in receiving your purchases.</p>
            `
          },
           {
            title: 'Updating Your Any & All Username',
            slug: 'update-username',
            content: `
              <p>You can update your username at any time in your Account Settings. Your username is how other users will see you in chat and on your profile.</p>
            `
          }
        ]
      },
      {
        title: 'Shipping',
        articles: [
            {
                title: 'Track your order',
                slug: 'track-order',
                content: '<p>Once your order is shipped, you will receive a tracking number in your purchase history. You can use this to track the status of your delivery.</p>'
            },
            {
                title: 'Shipping Policy',
                slug: 'shipping-policy',
                content: '<p>We offer a flat shipping rate of ₹60 for all orders, for both buyers and sellers. All items are first shipped to our warehouse for verification or quality checks before being sent to you, ensuring a safe and reliable experience.</p>'
            },
            {
                title: 'Fix a wrong shipping address for your order',
                slug: 'fix-shipping-address',
                content: '<p>If you have entered a wrong shipping address, please contact support immediately. If the item has not yet been dispatched from the seller, we may be able to update it. We cannot guarantee changes after an order has been placed.</p>'
            }
        ]
      }
    ]
  },
  account: {
    title: 'Account',
    sections: [
        {
            title: 'Manage your account',
            articles: [
                {
                    title: 'Setting up your Mobile App Notification Settings',
                    slug: 'mobile-notifications',
                    content: '<p>To manage your notifications, go to the settings within the Any & All mobile app. You can customize alerts for when shows go live, when you are outbid, and for messages.</p>'
                },
                {
                    title: 'Managing Multiple Accounts on Any & All',
                    slug: 'multiple-accounts',
                    content: '<p>Users are generally permitted to have only one buying account. Operating multiple accounts to circumvent limits or policies may result in suspension. Sellers may have separate buyer and seller accounts with approval.</p>'
                },
                {
                    title: 'Update your Email and Password - Self Service',
                    slug: 'update-email-password',
                    content: '<p>You can update your email and password at any time from the "Account" section in your settings. For security, you will be asked to confirm your current password to make changes.</p>'
                },
                {
                    title: 'Update your phone number',
                    slug: 'update-phone',
                    content: '<p>Your phone number can be updated in your Account Settings. You will be required to verify the new number via an OTP code.</p>'
                },
                {
                    title: 'Deleting Your Any & All Account',
                    slug: 'delete-account',
                    content: '<p>You can request to delete your account from the "Account" section in your settings. Please note that this action is permanent and cannot be undone. All your data will be removed in accordance with our privacy policy.</p>'
                },
                {
                    title: 'Contact Any & All support',
                    slug: 'contact-support',
                    content: '<p>If you need help, you can contact our support team through the "Help Center" or via the "Contact Us" link in your account settings. We are here to help!</p>'
                }
            ]
        }
    ]
  }
};
