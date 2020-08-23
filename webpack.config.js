//add at the top
const WorkboxWebpackPlugin = require("workbox-webpack-plugin");

//add inside the plugins array:
plugins: [
, new WorkboxWebpackPlugin.InjectManifest({
  swSrc: "src-sw.js",
  swDest: "service-worker.js"
})
]