try {
  module.exports = require("../.medusa/server/src/admin/index.js");
} catch {
  module.exports = require("../src/admin/index");
}
