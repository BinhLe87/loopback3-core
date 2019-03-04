## Update tree position levels
Update tree position levels starting from a workbook - chapter(s) - page(s)

> Example Request

```shell
curl -X PATCH \
  'http://localhost:8080/api/util/move_position?access_token={access_token}' \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -d tree_view={tree_position_levels}
```


```json
This is a sample tree_view object json:

{
    "id": 10,
    "type": "workbook", 
    "elements": [ 
        {
            "id": 5,
            "type": "chapter",            
            "display": 0,
            "elements": [
                {
                    "id": 19,
                    "type": "page",
                    "display": 0
                },
                {
                    "id": 13,
                    "type": "page",
                    "display": 1
                }                  
            ]
        },
        {
            "id": 4,
            "type": "chapter",            
            "display": 1,
            "elements": [
                {
                    "id": 33,
                    "type": "page",
                    "display":0
                }
                
            ]
        }
    ]    
}
```

> Example Response

```json
{
    "message": "OK"
}
```

### HTTP Request
**PATCH** `http://localhost:8080/api/util/move_position?access_token={access_token}`

### Request params

| Parameter       | Data type | Required? | Default | Description |
| --------------- | --------- | --------- | ------- | ----------- |
|access_token | string | Required | | access token. In order to [get access token](http://dev01.cc.cloud:49173/public/client_api_docs/#get-an-access-token), make an API call `/api/login`.|



### Request body

| Parameter       | Data type | Required? | Default | Description |                                                     
| --------------- | --------- | --------- | ------- | ----------- |
|tree_view | json | Required | | The tree position levels starting from a workbook - chapter(s) - page(s). See example `tree_view` json object in *Example Request* section above.  |



### Response
If successful, return a response status code is 200.


