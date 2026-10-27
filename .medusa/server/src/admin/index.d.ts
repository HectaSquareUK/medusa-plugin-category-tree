declare const plugin: {
    widgetModule: {
        widgets: any[];
    };
    routeModule: {
        routes: {
            Component: () => import("react/jsx-runtime").JSX.Element;
            path: string;
        }[];
    };
    menuItemModule: {
        menuItems: {
            label: string;
            icon: import("react").ComponentType;
            path: string;
        }[];
    };
    formModule: {
        customFields: {};
    };
    displayModule: {
        displays: {};
    };
    i18nModule: {
        resources: {};
    };
};
export default plugin;
