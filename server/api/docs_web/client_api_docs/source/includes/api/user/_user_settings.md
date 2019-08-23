## User settings
Create/Get/Update user settings.

###1. Get user settings

**GET** `http://localhost:8080/api/users/me/settings?access_token={access_token}`

###2. Create a user setting

**POST** `http://localhost:8080/api/users/me/settings?access_token={access_token}`

### Request body

| Parameter       | Data type | Required? | Default | Description |
| --------------- | --------- | --------- | ------- | ----------- |
| code | string | Required | | New setting code will be created|
|value | any | Required | | New setting value will be created|


###3. Update a user setting

**POST** `http://localhost:8080/api/user_settings/update?where={"code": "{code}"}&access_token={access_token}`

### Request params
| Parameter       | Data type | Required? | Default | Description |
| --------------- | --------- | --------- | ------- | ----------- |
| code | string | Required | | Setting code need to be updated|

### Request body

| Parameter       | Data type | Required? | Default | Description |
| --------------- | --------- | --------- | ------- | ----------- |
|value | any | Required | | New setting value will be updated.|


