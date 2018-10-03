## List of comments

### Response
If successful, returns a object containts all information of a comment..

| Parameter | Data type | Description |
| --------- | --------- | --------- |
id | string | The comment ID
comment_owner | integer | The user ID that made this comment
message | string | The comment text
message_tags | array | An array of user ID tagged in message
parent | integer | For comment replies, this is the comment ID that a reply to
reply_count | integer | Number of replies to this comment
vote_up_count | integer | Number of times this comment was voted up
vote_down_count | integer | Number of times this comment was voted down
status | string | state of the comment

<aside class="notice">
References: https://developers.facebook.com/docs/graph-api/reference/v3.1/comment
</aside>

