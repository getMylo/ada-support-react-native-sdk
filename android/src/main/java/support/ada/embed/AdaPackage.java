package support.ada.embed;

import com.facebook.react.ReactPackage;
import com.facebook.react.bridge.JavaScriptModule;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.uimanager.ViewManager;

import java.util.Collections;
import java.util.List;
import java.util.Arrays;
import java.util.ArrayList;

public class AdaPackage implements ReactPackage {
    @Override
    public List<NativeModule> createNativeModules(
            ReactApplicationContext reactContext) {

        List<NativeModule> modules = new ArrayList<>();

        return modules;
    }

    @Override
    public List<ViewManager> createViewManagers(
            ReactApplicationContext reactContext) {
        return Arrays.<ViewManager>asList();
    }

}
