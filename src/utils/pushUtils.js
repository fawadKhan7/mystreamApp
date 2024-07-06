const webpush = require('web-push');
require('dotenv').config();

webpush.setVapidDetails(
    `${process.env.PUSH_NOTIFICATION_EMAIL ? `mailto:${process.env.PUSH_NOTIFICATION_EMAIL}` : 'mailto:your-email@example.com'} `,
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
);

const sendPushNotification = (subscription, payload) => {
    webpush.sendNotification(subscription, payload)
        .catch(error => console.error('Error sending notification', error));
};

module.exports = sendPushNotification;
