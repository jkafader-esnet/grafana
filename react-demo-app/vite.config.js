import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: false,
      },
      "/scrapeBootData": {
        target: "http://localhost:3000/",
        changeOrigin: false,
        rewrite: (path)=>{ return path.replace("/scrapeBootData", ""); },
        configure: (proxy, options)=>{
          options.selfHandleResponse = true;
          proxy.on("proxyRes", (proxyRes, req, res) => {
              // wow this is crazytown! JAVASCRIPT! pew pew!
              const chunks = [];
              proxyRes.on("data", (chunk) => { chunks.push(chunk); });
              proxyRes.on("end", () => {
                const buffer = Buffer.concat(chunks);
                // split the grafana boot data out of the page info ;-)>
                const preamble = "window.grafanaBootData =";
                if(buffer.toString().indexOf(preamble) >= 0){
                  // crazy splits! It's horrible! and reliable.
                  let bootData = buffer.toString().split(preamble)[1].split('</script>')[0];
                  // and now it's JS again! pew pew!
                  res.write(preamble + bootData);
                } else {
                  res.write(buffer);
                }
                res.end();
              });
          });
        }
      }
    }
  },
  plugins: [react()],
})
