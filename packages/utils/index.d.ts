import { namespace } from '../logger/index';

type CallBackFunc = (key, value) => void;

export declare namespace rabbitmq {

    export declare type ConsumeHandler = (message: any) => void;
    export declare function create_channel(socketOptions? : object, url? : string, exchange_name?: string, is_use_channel_cache? : boolean): void;
    export declare function send_message(mesasge: string | object, routing_key: string, channel?: any, options?: object): void;
    export declare function consume_message_direct(routing_key: string, callback: ConsumeHandler, queue_name?: string, channel?: any): void;
    export declare function consume_message_topic(routing_key: string, callback: ConsumeHandler, queue_name?: string, channel?: any): void;
    export declare function close_connection(): void;
}

export declare namespace validators {

    export declare const baseJoiOptions;
}

export declare namespace redis {
    export declare function schedule_job(job_data: any, will_exec_in_seconds: number, callback?: CallBackFunc);
}

export declare namespace mixed_utils {
    export declare function inspect(object_message:object):string;
}

export declare namespace expressjs {
    export declare function server(port: number);
}

