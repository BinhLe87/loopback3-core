#Item type

## List item types
Return a list of item types.

### HTTP Request
GET `http://localhost:8080/api/item_types`

### Query Parameters

To filter response data, see [here](http://localhost:4567/#data-filters) 

> Example Request

```shell
curl -X GET --header 'Accept: application/json' 'http://localhost:8080/api/item_types'
```

> Example Response

```json
{
  "links": {
    "self": "http:/localhost:8080/api/item_types?filter[skip]=0&filter[limit]=1",
    "next": "http://localhost:8080/api/item_types?filter[skip]=1&filter[limit]=1"
  },
  "meta": {
    "count": 8,
    "total-pages": 8,
    "limit": 1,
    "skip": 0
  },
  "data": [
    {
      "id": 1,
      "type": "item_type",
      "attributes": {
        "code": "audio",
        "label": "question",
        "is_active": true
      },
      "relationships": {
        "attributes": {
          "links": {
            "self": "http:/localhost:8080/api/item_types/1?filter[include][attributes]",
            "related": "http:/localhost:8080/api/item_types/1/attributes"
          }
        }
      }
    }
  ],
  "schema": {
    "code": {
      "type": "string",
      "required": true
    },
    "label": {
      "type": "string"
    },
    "is_active": {
      "type": "boolean",
      "default": 1
    },
    "id": {
      "id": 1,
      "generated": true,
      "updateOnly": true
    }
  }
}
```