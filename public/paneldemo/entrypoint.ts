import ReactDOM from 'react-dom';
import React from 'react';
import { DashboardPanel } from '../app/features/dashboard/dashgrid/DashboardPanel.tsx';
import { DashboardModel } from '../app/features/dashboard/state/DashboardModel.ts';
import { PanelModel } from '../app/features/dashboard/state/PanelModel.ts';
import { backendSrv } from '../app/core/services/backend_srv.ts';
import { configureStore } from '../app/store/configureStore.ts';
import { Provider } from 'react-redux';
import { profiler } from 'app/core/profiler';

// imports copied from app.ts
import { PanelRenderer } from '../app/features/panel/PanelRenderer';
import { registerEchoBackend, setEchoSrv, setPanelRenderer, setQueryRunnerFactory, locationService, navigationLogger } from '@grafana/runtime';
import config from 'app/core/config';
import { QueryRunner } from '../app/features/query/state/QueryRunner';
import { setVariableQueryRunner, VariableQueryRunner } from '../app/features/variables/query/VariableQueryRunner';
import { ConfigContext, ThemeProvider } from '../app/core/utils/ConfigProvider';
import { ErrorBoundaryAlert, GlobalStyles, ModalRoot, ModalsProvider } from '@grafana/ui';

import { setDataSourceSrv, getBackendSrv, setBackendSrv } from '@grafana/runtime';
import DatasourceSrv, { getDatasourceSrv } from 'app/features/plugins/datasource_srv';
import { DashboardSrv, setDashboardSrv } from 'app/features/dashboard/services/DashboardSrv';

import { AngularApp } from './angular/AngularApp';
import { DashboardRoutes } from 'app/types';
import { initDashboard } from 'app/features/dashboard/state/initDashboard';
import { Echo } from '../app/core/services/echo/Echo';

var GrafContext = function(dashboardUid) {
    "use strict";
    // instead of having a single instance of `_stateStore`, we may want to have one for each dashboard uid passed in...
    // or actually probably we want to have a different mechanism to bind to a specific dashboard uid.
    if (GrafContext._stateStore) {
        // This allows the constructor to be called multiple times
        // and refer to the same instance. Another option is to
        // throw an error.
	return new Promise(function(resolve, reject){
	    resolve(GrafContext._stateStore);
	})
    }
    GrafContext._stateStore = configureStore();

    console.log('profiler', profiler);
    profiler.window = {};
  
    setPanelRenderer(PanelRenderer);
    setQueryRunnerFactory(() => new QueryRunner());
    setVariableQueryRunner(new VariableQueryRunner());
    setEchoSrv(new Echo({ debug: true }));

    // Datasource variable $datasource with current value ''
    const templateSrv: any = {
      getVariables: () => [
        { type: 'datasource', name: 'datasource', current: { value: '', }, },
        { type: 'datasource', name: 'datasourceDefault', current: { value: 'default', }, },
      ],
      replace: (v: string) => {
        let result = v.replace('${datasource}', '');
        result = result.replace('${datasourceDefault}', 'default');
        return result;
      },
    };

    var datasourceSrv = new DatasourceSrv({}, {}, templateSrv);
    datasourceSrv.init(config.datasources, config.defaultDatasource);
    setDataSourceSrv(datasourceSrv);
    setBackendSrv(backendSrv);
    var dashboardSrv = new DashboardSrv();
    // possibly unnecessary: tested solution for "getDashboardQueryRunner can only be used after Grafana instance has started."
    setDashboardSrv(dashboardSrv);
 
    // possibly unnecessary: tested solution for "getDashboardQueryRunner can only be used after Grafana instance has started."
    var params = {
      urlSlug: '',
      urlUid: dashboardUid,
      urlType: "string", // XXX: is this correct???
      routeName: DashboardRoutes.Normal,
      fixUrl: false,
    };
    // the above and this maybe need to be split out into separate thingies.
    var initter = initDashboard(params);
    var hasInitted = initter(GrafContext._stateStore.dispatch, GrafContext._stateStore.getState);

    // return a promise that resolves when our application is finished initialization.
    return hasInitted.then(function(){ return GrafContext._stateStore });
};
GrafContext.getState = function(dashboardUid) {
    "use strict";
    if(GrafContext._stateStore){
        return new Promise(function(resolve, reject){
            resolve(GrafContext._stateStore);
        });
    } else {
       return GrafContext(dashboardUid)
    }
}

var bindToElementId = function(store, dashboardUid, panelId, elementId, height, width){
  getPanel(store, dashboardUid, panelId, height, width).then(function(panelElem){
      ReactDOM.render(panelElem, document.getElementById(elementId));
  })
}

var bindToElement = function(store, dashboardUid, panelId, element, height, width){
  getPanel(store, dashboardUid, panelId, height, width).then(function(panelElem){
      ReactDOM.render(panelElem, element);
  });
}

var getPanel = function(store, dashboardUid, panelId, height, width){
  console.log("getPanel. store, dashboardUid, panelId, height, width", store, dashboardUid, panelId, height, width);
  return backendSrv.getDashboardByUid(dashboardUid).then(function(data){
    console.log("getPanel. after getDashboardByUid. data:", data);
    var dash = new DashboardModel(data.dashboard);
    var panel = dash.getPanelById(panelId);
    console.log("getPanel. after getDashboardByUid. dash, panel:", dash, panel);
    return React.createElement(Provider, {
      store: store },
      React.createElement(ConfigContext.Provider, {
        value: config },
          React.createElement(DashboardPanel, {
            width: width,
            height: height,
            dashboard: dash,
            panel: panel,
            isEditing: false,
            isViewing: false,
            isInView: true })
      )
    )
  });
}

export const bindPanelToElement = bindToElement;
export const bindPanelToElementId = bindToElementId;
export const getPanelElement = getPanel;
export const GrafanaContext = GrafContext;