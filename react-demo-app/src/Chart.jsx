import React from "react";

class Chart extends React.Component {
    constructor(props) {
        super(props);
        this.domTarget = React.createRef();
    }

    componentDidMount() {
        let myElem = this.domTarget.current;
        let props = this.props;
        console.log("window.Grafana", window.Grafana);
        if(!window.Grafana) {
            console.error("window.Grafana not found"); return;
        }
        window.Grafana.Context(this.props.dashboardUid).then(function (appContext) {
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
        });
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