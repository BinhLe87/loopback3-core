## Update tree position levels
Update tree position levels that allow starting at any level in the tree - means support to update a part of tree level of workbook - chapter(s) - page(s) - item(s).

> Example Request

```shell
curl -X PATCH \
  'http://localhost:8080/api/util/move_position?access_token={access_token}' \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -d tree_view={tree_position_levels}
```


```json
This is a sample of entire tree_view object json, however you can update a part of tree if needed:

{
    "id": 10,
    "type": "workbook", 
    "elements": [ 
        {
            "id": 5,
            "type": "chapter",            
            "display": 1,
            "elements": [
                {
                    "id": 19,
                    "type": "page",
                    "display": 1,
                    "elements": [
                        {
                            "id": 10,
                            "type": "item",            
                            "display": 1
                        }
                    ]
                },
                {
                    "id": 13,
                    "type": "page",
                    "display": 2
                }                  
            ]
        },
        {
            "id": 4,
            "type": "chapter",            
            "display": 2,
            "elements": [
                {
                    "id": 33,
                    "type": "page",
                    "display": 1
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
|tree_view | json | Required | | tree position levels that allow starting at any level in the tree - means support to update a part of tree level of workbook - chapter(s) - page(s) - item(s). See example `tree_view` json object in *Example Request* section above. #   |



### Response
If successful, return a response status code is 200.


