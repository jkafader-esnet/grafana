import React from "react";

class Chart extends React.Component {
    constructor(props) {
        super(props);
        this.domTarget = React.createRef();
        this.bound = false;
    }

    bindGrafana() {
        if(!this.bound){
            window.Grafana.Context(this.props.dashboardUid).then((appContext)=>{
                console.log("on the client side. appContext is now", appContext)
                // signature: function(appContext, dashboardUid, panelId, HTML Element, height, width)
                window.Grafana.bindPanelToElement(
                    appContext,
                    props.dashboardUid,
                    props.panelId,
                    myElem,
                    parseInt(props.height),
                    parseInt(props.width)
                );
                this.bound = true;
            }).catch((err)=>{
                console.log(err);
                console.log('recursing...');
                setTimeout(this.bindGrafana(), 1000);
            });
        }
    }

    componentDidMount() {
        if(!window.Grafana) {
            console.error("window.Grafana not found"); return;
        }
        if(!window.grafanaBootData?.settings?.datasources){
            console.error("window.grafanaBootData not found"); return;
        }
        let myElem = this.domTarget.current;
        let props = this.props;
        window.Grafana.Context(this.props.dashboardUid).then((appContext)=>{
            console.log("on the client side. appContext is now", appContext)
            // signature: function(appContext, dashboardUid, panelId, HTML Element, height, width)
            window.Grafana.bindPanelToElement(
                appContext,
                props.dashboardUid,
                props.panelId,
                myElem,
                parseInt(props.height),
                parseInt(props.width)
            );
        })
    }

    render() {
        let styles = {
            height: parseInt(this.props.height) + 20 + "px", // 20px for "safety"
            width: parseInt(this.props.width) + 20 + "px",
        };
        return <div className="grafana panel" ref={this.domTarget} style={styles} />;
    }
}

export { Chart };
export default Chart;