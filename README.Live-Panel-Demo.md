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

9. Errata / Strong proof-of-concept vibes

Currently, there are a number of crazy things in here. 

- One of them is that we run a proxy in front of grafana that scrapes window.grafanaBootData in a very willy-nilly way (split() abounds). I think probably this is the area where we should put this entire thing behind a Go API endpoint. This is also very likely where access control will come most directly into play. I can't imagine that this is information everyone will want published.

- Another of them is that we're also going to be proxying CSS. This needs refinement.

- Yet another of them is that I'm terribly ashamed of requiring a dashboard UID to be compiled directly into the code. It's... not great, at all. Obviously we can parameterize this into settings, but that doesn't seem good enough either... Perhaps a list of available dashboard UIDs from a separate service? Again, security probably comes into play here.

- Speaking of security, there's not really any security to speak of. This will have to be brought up to snuff.

- I brought up the concept of a BFF with Juani surrounding security, that's a whole complex conversation that lives on the current bleeding edge of authentication. This is more concept than executed software in most contexts.

- Even after a couple of coding passes, I don't think entrypoint.ts comes even close to passing linting. That's what I get for writing code in plain text. This definitely needs cleanup.

