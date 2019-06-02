export namespace logger {

    export declare function log(level: String = 'info', error: Object | String, req?: any, options?: Object): void;
    export declare function silly(error: Object | String, req?: any, options?: Object): void;
    export declare function debug(error: Object | String, req?: any, options?: Object): void;
    export declare function verbose(error: Object | String, req?: any, options?: Object): void;
    export declare function info(error: Object | String, req?: any, options?: Object): void;
    export declare function warn(error: Object | String, req?: any, options?: Object): void;
    export declare function error(error: Object | String, req?: any, options?: Object): void;
    export declare function err(error: Object | String, req?: any, options?: Object): void;
}

