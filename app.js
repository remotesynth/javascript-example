require("dotenv").config();
const express = require("express");
const path = require("path");
const request = require("request");
const app = express();
const http = require("http");
const reload = require("reload");
const LaunchDarkly = require("launchdarkly-node-server-sdk");

client = LaunchDarkly.init(process.env.LAUNCHDARKLY_SDK_KEY);

async function init() {
  app.get("/image.jpg", async function (req, res) {
    const pexels = "https://images.pexels.com/photos/";
    const bannerImage = await client.variation(
      "banner-image",
      { key: "anonymous" },
      false
    );
    let image = pexels + bannerImage + "?auto=compress&cs=tinysrgb&w=500&dpr=1";
    request
      .get(image)
      .on("response", function (response) {
        res.set("Content-Type", "image/jpeg");
        res.writeHead(
          response.statusCode,
          "{'Content-Type: '" + response.headers["content-type"] + "'}"
        );
      })
      .pipe(res);
  });

  app.use(express.static(path.join(__dirname, "public")));

  app.set("port", 3000);

  const server = http.createServer(app);
  reload(app)
    .then(function (reloadReturned) {
      client.on("update:banner-image", () => {
        reloadReturned.reload();
      });

      // Reload started, start web server
      server.listen(app.get("port"), function () {
        console.log("Web server listening on port " + app.get("port"));
      });
    })
    .catch(function (err) {
      console.error(
        "Reload could not start, could not start server/sample app",
        err
      );
    });
}
init();
