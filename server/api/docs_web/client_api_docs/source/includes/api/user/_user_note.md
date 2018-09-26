## List of user notes
Return a list notes belong to a specific user.

> Example Request

```shell
curl -X GET \
  'http://localhost:8080/api/users/1/notes?access_token=Dz3EuG3lAHG4yina2jPhdknjFfxfebeow6g88ekzrLpCrMGaNG9e3HjMBrgWGBKf'
```

> Example Response

```json
{
    "links": {
        "self": "http:/localhost:8080/api/users/1/notes?access_token=Dz3EuG3lAHG4yina2jPhdknjFfxfebeow6g88ekzrLpCrMGaNG9e3HjMBrgWGBKf"
    },
    "meta": {
        "count": 3,
        "total-pages": 1,
        "limit": null,
        "skip": 0
    },
    "data": [
        {
            "id": 1,
            "type": "user_note",
            "attributes": {
                "content": "user note 1",
                "userId": 1,
                "noteableId": 1,
                "noteableType": "page"
            },
            "relationships": {
                "user": {
                    "links": {
                        "self": "http:/localhost:8080/api/user_notes/1?filter[include][user]",
                        "related": "http:/localhost:8080/api/user_notes/1/user"
                    }
                },
                "noteable": {
                    "links": {
                        "self": "http:/localhost:8080/api/user_notes/1?filter[include][noteable]",
                        "related": "http:/localhost:8080/api/user_notes/1/noteable"
                    }
                }
            }
        },        
        {
            "id": 3,
            "type": "user_note",
            "attributes": {
                "content": "note 3 - workbook",
                "userId": 1,
                "noteableId": 1,
                "noteableType": "workbook"
            },
            "relationships": {
                "user": {
                    "links": {
                        "self": "http:/localhost:8080/api/user_notes/3?filter[include][user]",
                        "related": "http:/localhost:8080/api/user_notes/3/user"
                    }
                },
                "noteable": {
                    "links": {
                        "self": "http:/localhost:8080/api/user_notes/3?filter[include][noteable]",
                        "related": "http:/localhost:8080/api/user_notes/3/noteable"
                    }
                }
            }
        }
    ],
    "schema": {
        "content": {
            "type": "string",
            "required": true
        },
        "id": {
            "id": 1,
            "generated": true,
            "updateOnly": true
        },
        "userId": {},
        "noteableId": {},
        "noteableType": {
            "type": "string",
            "index": true
        }
    }
}
```

### HTTP Request
**GET** `http://localhost:8080/api/clients/{client_id}/notes`

### Header parameters

### Request query string

| Parameter       | Data type | Required? | Default | Description |
| --------------- | --------- | --------- | ------- | ----------- |
| access_token | string | required | | the access_token. To get an access token, you can make an access token API call, read [here](http://dev01.cc.cloud:49173/docs/#access_token)  |
| filter[include]=noteable | string | optional | | To get response data that contains source place info where the note was noted on - it may be a page/a workbook or somewhere like that. You can use this info for navigating to source place on purpose.


### Response
If successful, return an object contains `data` property is an array of notes belong to a specific user.

| Parameter | Data type | Description |
| --------- | --------- | --------- |
|type | string | In case you input `filter[include]=noteable` in request query string, in `data` response, the `type` property of each element in `included` array indicate type of source place, it can be a `page`/`workbook`... 

