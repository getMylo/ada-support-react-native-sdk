import React from "react";
import {WebView} from 'react-native-webview';
import RNBlobUtil from 'react-native-blob-util';
import PropTypes from 'prop-types';
import {Platform, Linking} from 'react-native';

const EMBED_URL_ANDROID = "file:///android_asset/embed.html"
const EMBED_URL = require('./android/src/main/assets/embed.html');

const MESSAGE_SCRIPT_LOADED = `MESSAGE_SCRIPT_LOADED`
const MESSAGE_ADA_READY = `MESSAGE_ADA_READY`
const MESSAGE_CHATTER_AUTH = `MESSAGE_CHATTER_AUTH`
const MESSAGE_EVENT = `MESSAGE_EVENT`
const END_CONVERSATION_EVENT = `END_CONVERSATION_EVENT`

export default class AdaEmbedView extends React.Component {

    actions = new Set();

    static propTypes = {
        handle: PropTypes.string,
        cluster: PropTypes.string,
        styles: PropTypes.string,

        language: PropTypes.string,
        greetings: PropTypes.string,
        metaFields: PropTypes.object,
        sensitiveMetaFields: PropTypes.object,

        thirdPartyCookiesEnabled: PropTypes.bool,

        zdChatterAuthCallback: PropTypes.func,
        eventCallbacks: PropTypes.object,
        endConversationCallback: PropTypes.func
    }

    static defaultProps = {
        handle: ``,
        cluster: ``,
        styles: ``,

        language: ``,
        greetings: ``,
        metaFields: null,
        sensitiveMetaFields: null,

        thirdPartyCookiesEnabled: false,

        zdChatterAuthCallback: null,
        eventCallbacks: null,
        endConversationCallback: () => {}
    }

    constructor(props) {
        super(props);
        this.state = {
            isAdaReady: false
        }
    }

    shouldOpenInline(requestUrl) {
        const allowedUrls = ['embed.html', 'ada-instance-id', 'embed2', 'ada.support/embed/', 'ada-dev2.support/embed/'];
        return allowedUrls.some(url => requestUrl.includes(url));
    }
    downloadTranscriptiOS(url){
        if(Platform.OS == 'ios'){
            RNBlobUtil
            // .config({
            //     fileCache: true,
            // })
            .fetch('GET', url, {
            // Authorization: `bearer access-token...`
            })
                .then((res) => {
                    let status = res.info().status;

                    if (status == 200) {
                        // the conversion is done in native code
                        let base64Str = res.base64()
                        // the following conversions are done in js, it's SYNC
                        let text = res.text()
                        let json = res.json()
                    }
                    else {
                        // handle other status codes
                    }
                })
                // Something went wrong:
                .catch((errorMessage, statusCode) => {
                    console.log('statusCode:', statusCode);
                    console.log('error:', errorMessage);
                })
        }
    }

    render() {
        const source = Platform.OS === 'android' ? {uri: EMBED_URL_ANDROID} : EMBED_URL
        return <WebView source={source}
                        domStorageEnabled={true}
                        allowUniversalAccessFromFileURLs={true}
                        thirdPartyCookiesEnabled={this.props.thirdPartyCookiesEnabled}
                        ref={ref => (this.webview = ref)}
                        onMessage={(event) => {
                            this.handleEvent(event)
                        }}
                        originWhitelist={[`*`]}
                        onShouldStartLoadWithRequest={request => {                            
                            if(request.url.includes("transcript/txt") && Platform.OS == 'ios'){
                                this.downloadTranscriptiOS(request.url)
                                return false;
                            } else if(!this.shouldOpenInline(request.url)){
                                Linking.openURL(request.url)
                                    .catch(()=>{})
                                return false
                            }
                            return true

                        }}
        />
    }

    shouldComponentUpdate(nextProps, nextState, nextContext) {
        if (this.props.handle !== nextProps.handle ||
            this.props.cluster !== nextProps.cluster ||
            this.props.styles !== nextProps.styles ||
            this.props.language !== nextProps.language ||
            this.props.greetings !== nextProps.greetings ||
            JSON.stringify(this.props.metaFields) !== JSON.stringify(nextProps.metaFields) ||
            JSON.stringify(this.props.sensitiveMetaFields) !== JSON.stringify(nextProps.sensitiveMetaFields)) {

            this.state.isAdaReady = false
            this.webview.reload()
        }
        return this.props.thirdPartyCookiesEnabled !== nextProps.thirdPartyCookiesEnabled
    }

    handleEvent = (event) => {
        const eventData = JSON.parse(event.nativeEvent.data)
        switch (eventData.name) {
            case MESSAGE_SCRIPT_LOADED:
                this.webview.injectJavaScript(this.#initializeEmbedScript(this.props));
                break;
            case MESSAGE_ADA_READY:
                this.state.isAdaReady = true
                this.actions.forEach((action) => {
                    this.#executeAction(action)
                })
                this.actions.clear()
                break;
            case MESSAGE_CHATTER_AUTH:
                if (this.props.zdChatterAuthCallback != null) {
                    this.props.zdChatterAuthCallback((token) => {
                        this.webview.injectJavaScript(`sendAuthToken("${token}")`);
                    })
                }
                break;
            case MESSAGE_EVENT:
                if (this.props.eventCallbacks != null) {
                    const eventCallback = this.props.eventCallbacks[eventData.data.event_name]
                    const defEventCallback = this.props.eventCallbacks["*"]
                    if (eventCallback != null) {
                        eventCallback(eventData.data)
                    }
                    if (defEventCallback != null) {
                        defEventCallback(eventData.data)
                    }
                }
                break;
            case END_CONVERSATION_EVENT:
                this.props.endConversationCallback(eventData.data)
                break;
            default:
                break;
        }
    }

    deleteHistory = () => {
        this.#executeAction(`deleteHistory()`)
    }

    reset = (object) => {
        this.#executeAction(`reset(${JSON.stringify(object)})`)
    }

    setMetaFields = (object) => {
        this.#executeAction(`setMetaFields(${JSON.stringify(object)})`)
    }

    setSensitiveMetaFields = (object) => {
        this.#executeAction(`setSensitiveMetaFields(${JSON.stringify(object)})`)
    }

    #executeAction = (action) => {
        if (this.state.isAdaReady) {
            this.webview.injectJavaScript(action);
        } else {
            this.actions.add(action)
        }
    }

    #initializeEmbedScript = () => {
        return `initializeEmbed("${this.props.handle}", "${this.props.cluster}", "${this.props.greetings}", "${this.props.styles}", "${this.props.language}", ${JSON.stringify(this.props.metaFields)}, ${JSON.stringify(this.props.sensitiveMetaFields)})`
    }
}