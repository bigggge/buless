const fs = require("fs");
const path = require("path");

// https://developer.mozilla.org/zh-TW/docs/Web/HTTP/Basics_of_HTTP/MIME_types
const IMGS = [
  { ext: "apng", MIME: "image/apng" },
  { ext: "bmp", MIME: "image/bmp" },
  { ext: "gif", MIME: "image/gif" },
  { ext: "ico", MIME: "image/x-icon" },
  { ext: "cur", MIME: "image/x-icon" },
  { ext: "jpeg", MIME: "image/jpeg" },
  { ext: "jpg", MIME: "image/jpeg" },
  { ext: "png", MIME: "image/png" },
  { ext: "svg", MIME: "image/svg+xml" },
  { ext: "webp", MIME: "image/webp" },
];

const img = ({ app, root }) => {
  app.use((ctx, next) => {
    const {
      request: { url },
    } = ctx;
    IMGS.forEach((img) => {
      if (url.endsWith(img.ext)) {
        console.log("image", url);
        const p = path.resolve(root, url.slice(1));
        console.log(p);
        const file = fs.readFileSync(p, "utf-8");
        ctx.type = img.MIME;
        ctx.body = file;
      }
    });

    return next();
  });
};
module.exports = img;
