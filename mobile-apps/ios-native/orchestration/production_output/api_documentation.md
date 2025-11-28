Given the complexity and breadth of the requirements, I'll provide a detailed outline and examples for each section of the API documentation using OpenAPI 3.0 specification format. This example will assume a hypothetical API service that manages user profiles.

### 1. Authentication Flows

**OAuth 2.0**

```yaml
components:
  securitySchemes:
    OAuth2:
      type: oauth2
      flows:
        authorizationCode:
          authorizationUrl: https://example.com/oauth/authorize
          tokenUrl: https://example.com/oauth/token
          scopes:
            read: Read access
            write: Write access
```

### 2. Endpoints with Request/Response Examples

**Get User Profile**

```yaml
paths:
  /users/{userId}:
    get:
      summary: Get a user profile
      operationId: getUserProfile
      parameters:
        - name: userId
          in: path
          required: true
          schema:
            type: string
      responses:
        '200':
          description: Successful response
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/UserProfile'
              example:
                id: "123"
                username: "john_doe"
                email: "john.doe@example.com"
```

### 3. Error Codes and Handling

```yaml
components:
  responses:
    NotFound:
      description: The specified resource was not found
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'
          example:
            code: 404
            message: "Resource not found"
```

### 4. Rate Limiting Details

```yaml
headers:
  X-Rate-Limit-Limit:
    description: The number of allowed requests in the current period
    schema:
      type: integer
  X-Rate-Limit-Remaining:
    description: The number of remaining requests in the current period
    schema:
      type: integer
  X-Rate-Limit-Reset:
    description: The time at which the current rate limit window resets in UTC epoch seconds
    schema:
      type: integer
```

### 5. Webhooks Documentation

**Webhook for User Profile Update**

```yaml
webhooks:
  userProfileUpdated:
    post:
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/UserProfile'
      responses:
        '200':
          description: Webhook processed successfully
```

### 6. WebSocket Events

**User Events**

```yaml
components:
  messages:
    userUpdated:
      summary: Inform about user profile updates
      payload:
        $ref: '#/components/schemas/UserProfile'
```

### 7. SDK/Client Library Examples

**Python SDK Example**

```python
import client_library

api = client_library.ApiClient(token="your_access_token")
user_profile = api.get_user_profile(user_id="123")
print(user_profile)
```

### 8. Postman Collection

This would typically be a JSON file exported from Postman containing all the configured requests.

### 9. GraphQL Schema (if applicable)

```graphql
type Query {
  userProfile(userId: ID!): UserProfile
}

type UserProfile {
  id: ID!
  username: String!
  email: String!
}
```

### 10. Versioning Strategy

**Header Versioning**

```yaml
servers:
  - url: https://api.example.com/v1
    description: API version 1
  - url: https://api.example.com/v2
    description: API version 2
```

This example provides a basic structure for each section of the API documentation according to OpenAPI 3.0. Each section would need to be expanded with more details specific to the actual API's functionality and business requirements.