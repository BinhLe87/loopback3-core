service rabbitmq-server start
rabbitmq-plugins enable rabbitmq_management
######create new admin account can access UI web via localhost
rabbitmqctl add_user admin admin
rabbitmqctl set_user_tags admin administrator
rabbitmqctl set_permissions -p / admin ".*" ".*" ".*"