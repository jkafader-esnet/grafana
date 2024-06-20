Steps to get live panel exporter working:

1. Checkout repo from 
```
git clone git@github.com:jkafader-esnet/grafana.git
```

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

6. Create a dashboard, note down the first panel ID and the Dashboard UID.

If you click edit for the first panel, you can see both of these data in the URL bar.

7. Edit App.tsx

Change this line to match the Dashboard UI and Panel ID from step 6
```
<Chart dashboardUid="ediakwqx4axhca" panelId={1} height={300} width={650} />
```

8. Start the React application, demonstrating the exported panels.

[in another shell]
```
cd react-demo-app
npm run install
npm run dev
```

9. Errata / Ongoing considerations

Currently, there are a number of things that still require attention in here. 

- Currently, we're proxying CSS. This needs refinement. Possibly we should add a known-name target to the build for CSS files?

- How can we parameterize the Dashboard UID? This should definitely not be hard-coded. That said, given that dashboard UIDs are generally high-entropy strings, it seems like they are part of a security posture and we should publish a list to non-authenticated users.

- Currently, the `/api/bootdata` endpoint uses the same security scheme as the application root (`/`). This definitely needs more thought and refinement

- the `/api/bootdata` endpoint currently returns the `Access-Control-Allow-Origin: *` ("allow all hosts for CORS") policy. This seems like it should at least be a configurable list of downstream hosts.

- More conversation is definitely required to refine the approach to security and authentication overall.


