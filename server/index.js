const express = require("express");
const Topgg = require("@top-gg/sdk");
const config = require("../config.json");
const app = express(); // Your express app

const webhook = new Topgg.Webhook(config.topgg.webhookauth); // add your Top.gg webhook authorization (not bot token)

module.exports = {
  webhook: webhook,
  app: app,
};