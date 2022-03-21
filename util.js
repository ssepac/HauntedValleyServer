
const luxon = require('luxon')

/** Returns true if a time delta is less than or equal to threshold. */
const checkOnline = (threshold, newTime, oldTime) => newTime - oldTime <= threshold
const getSubscriberName = (host, port) => `subscriber${host}:${port}`

module.exports = {
    checkOnline,
    getSubscriberName
}