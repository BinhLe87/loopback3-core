'use strict';

module.exports = function(Usersetting) {

    Usersetting.observe('before save', async function(ctx) {

        var instance = ctx.instance || ctx.currentInstance;
        var current_user_id = _.get(ctx, 'options.current_user_id');
        var where_query = _.get(ctx, 'where', {});

        if (current_user_id) {

            if (instance) {
                instance.userId = current_user_id;
            } 
            where_query = _.assign(where_query, {userId: current_user_id});
        }

        console.log(ctx);
    });
};
