# waffle-2
The API backend for Waffle 2 written in Express + Node with JSON files for a database.

## Setup
Once all of the code files are downloaded, create a directory called `data`. In this directory, create files `users.json`, `posts.json`, and `chats.json`. Put `[]` in each file.

## Endpoints

### `/login` POST
The login enpoint takes a username and password and gives back an API key. 

#### Request:
Request Body:
```
{
  username: "whatever",
  password: "yeet"
}
```
#### Response
Response Body:
```
{
  success: true,
  apiKey: "key",
  username: "whatever"
}
```
### `/create-user` POST
Takes a username and password. Creates a user account and returns an API key.

#### Request:
Request Body:
```
{
  username: "whatever",
  password: "yeet"
}
```
#### Response
Response Body:
```
{
  success: true,
  apiKey: "key",
  username: "whatever"
}
```
### `/posts` GET
Takes nothing. Returns an unsorted list of posts.

#### Response
Response Body:
```
{
  success: true,
  posts: [
   
  ]
}
```
