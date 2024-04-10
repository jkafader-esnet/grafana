Steps to get live panel exporter working:

1. Checkout repo from [repo link]


2. Check out the live panel exporter branch:
```
git checkout live-panel-exporter
```

3. Install yarn modules
```
yarn install
```

4. Build grafana
```
yarn build
```
You should notice a different entry point file than the usual one generated for grafana. The file will be called something like:
```
/public/build/paneldemo/testlib.js
```

5. Start the Grafana server
```
make run
```

6. Create a dashboard, note down the first panel ID and the Dashboard UI.

If you click edit for the first panel, you can see both of these data.

7. Start a man-in-the-middle proxy

It's important that you don't stop the 'make run' command. That's running on port 3000, the python MITM proxy will run on port 9999.
[in another shell]
```
python3 -m venv venv
source venv/bin/activate
pip install mitmproxy
mitmdump --modify-headers '/~s/Access-Control-Allow-Origin/*' -m reverse:http://localhost:3000@9999
```

In case you're wondering about the proxy, it wraps Grafana, adding an 
```
Access-Control-Allow-Origin *
```

In reality, we would limit this to a single URL for exporting panels, as part of the Go server.

8. Edit App.tsx

Change this line to match the Dashboard UI and Panel ID from step 6
```
<Chart dashboardUid="ediakwqx4axhca" panelId={1} height="300" width="600" />
```

7. Start the React application, demonstrating the exported panels.

[in another shell]
```
cd react-demo-app
npm run install
npm run dev
```

