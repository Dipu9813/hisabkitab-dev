const webpush = require("web-push");

// Set VAPID details
webpush.setVapidDetails(
  `mailto:${process.env.VAPID_CONTACT_EMAIL}`,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

/**
 * Send push notification to a user
 * @param {Object} subscription - Push subscription object
 * @param {Object} payload - Notification payload
 */
const sendPushNotification = async (subscription, payload) => {
  try {
    const result = await webpush.sendNotification(
      subscription,
      JSON.stringify(payload)
    );
    console.log("✅ Push notification sent successfully");
    return result;
  } catch (error) {
    console.error("❌ Error sending push notification:", error);
    throw error;
  }
};

/**
 * Send reminder notification to borrower
 * @param {Object} subscription - Push subscription object
 * @param {Object} loanDetails - Loan details for the reminder
 */
const sendReminderNotification = async (subscription, loanDetails) => {
  const dueDateText = loanDetails.due_date
    ? `Due: ${new Date(loanDetails.due_date).toLocaleDateString()}`
    : "";

  const reasonText = loanDetails.reason ? ` for "${loanDetails.reason}"` : "";

  const payload = {
    title: `💸 Payment Reminder from ${
      loanDetails.lender?.full_name || "Unknown"
    }`,
    body: `You owe ₹${loanDetails.amount}${reasonText}. ${dueDateText}${
      dueDateText ? " ⏰" : ""
    } Please settle your balances with this user soon.`,
    icon: "/bara/serious_bara.png",
    badge: "/bara/serious_bara.png",
    tag: `loan-reminder-${loanDetails.id}`, // Prevents duplicate notifications
    requireInteraction: true, // Keeps notification visible until user interacts
    data: {
      type: "loan_reminder",
      loanId: loanDetails.id,
      amount: loanDetails.amount,
      lenderName: loanDetails.lender?.full_name || "Unknown",
      url: `/?loan=${loanDetails.id}`, // Use query parameter instead
      clickAction: `/?loan=${loanDetails.id}`, // URL to open when notification is clicked
    },
    actions: [
      {
        action: "view",
        title: "View Details",
        // icon: "/icon-72x72.png",
      },
      {
        action: "pay",
        title: "Mark as Paid",
        // icon: "/icon-72x72.png",
      },
    ],
  };

  return await sendPushNotification(subscription, payload);
};

/**
 * Send urgent reminder notification (for overdue loans)
 * @param {Object} subscription - Push subscription object
 * @param {Object} loanDetails - Loan details for the reminder
 */
const sendUrgentReminderNotification = async (subscription, loanDetails) => {
  const daysOverdue = loanDetails.due_date
    ? Math.floor(
        (new Date() - new Date(loanDetails.due_date)) / (1000 * 60 * 60 * 24)
      )
    : 0;

  const overdueText = daysOverdue > 0 ? ` (${daysOverdue} days overdue!)` : "";

  const payload = {
    title: `🚨 URGENT: Payment Overdue from ${
      loanDetails.lender?.full_name || "Unknown"
    }`,
    body: `Your loan of ₹${loanDetails.amount} is overdue${overdueText}. Please pay immediately to avoid penalties.`,
    // icon: "/icon-192x192.png",
    // badge: "/icon-72x72.png",
    tag: `urgent-reminder-${loanDetails.id}`,
    requireInteraction: true,
    silent: false, // Make sure it makes a sound
    data: {
      type: "urgent_loan_reminder",
      loanId: loanDetails.id,
      amount: loanDetails.amount,
      lenderName: loanDetails.lender?.full_name || "Unknown",
      daysOverdue: daysOverdue,
      url: `/?loan=${loanDetails.id}`,
    },
    actions: [
      {
        action: "pay_now",
        title: "💸 Pay Now",
        icon: "/icon-72x72.png",
      },
      {
        action: "contact",
        title: "📞 Contact Lender",
        icon: "/icon-72x72.png",
      },
    ],
  };

  return await sendPushNotification(subscription, payload);
};

/**
 * Send friendly reminder notification (for loans due soon)
 * @param {Object} subscription - Push subscription object
 * @param {Object} loanDetails - Loan details for the reminder
 */
const sendFriendlyReminderNotification = async (subscription, loanDetails) => {
  const daysUntilDue = loanDetails.due_date
    ? Math.ceil(
        (new Date(loanDetails.due_date) - new Date()) / (1000 * 60 * 60 * 24)
      )
    : null;

  const dueSoonText =
    daysUntilDue && daysUntilDue > 0
      ? ` Due in ${daysUntilDue} day${daysUntilDue !== 1 ? "s" : ""}`
      : "";

  const payload = {
    title: `💝 Friendly Reminder from ${
      loanDetails.lender?.full_name || "Unknown"
    }`,
    body: `Just a gentle reminder about your ₹${loanDetails.amount} loan.${dueSoonText} Thanks for being responsible! 😊`,
    icon: "/icon-192x192.png",
    badge: "/icon-72x72.png",
    tag: `friendly-reminder-${loanDetails.id}`,
    data: {
      type: "friendly_loan_reminder",
      loanId: loanDetails.id,
      amount: loanDetails.amount,
      lenderName: loanDetails.lender?.full_name || "Unknown",
      url: `/?loan=${loanDetails.id}`,
    },
    actions: [
      {
        action: "view",
        title: "📋 View Details",
        icon: "/icon-72x72.png",
      },
      {
        action: "schedule",
        title: "📅 Schedule Payment",
        icon: "/icon-72x72.png",
      },
    ],
  };

  return await sendPushNotification(subscription, payload);
};

module.exports = {
  sendPushNotification,
  sendReminderNotification,
  sendUrgentReminderNotification,
  sendFriendlyReminderNotification,
};
