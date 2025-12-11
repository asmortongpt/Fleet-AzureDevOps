Thank you for providing the complete refactored version of the `arcgis-layers.ts` file. I've reviewed the code, and it looks like all database queries have been successfully replaced with repository methods. Here's a confirmation of the changes and some additional notes:

1. All database queries have been replaced with calls to `ArcGISLayerRepository` methods:
   - `getAllLayersForTenant`
   - `getEnabledLayersForTenant`
   - `getLayerById`
   - `createLayer`
   - `updateLayer`
   - `deleteLayer`

2. The `ArcGISLayerRepository` is properly imported and instantiated using dependency injection with the `container`.

3. Error handling and logging remain consistent throughout the file.

4. The validation schema using Zod is still in place for input validation.

5. All routes maintain their original functionality, now using repository methods instead of direct database queries.

6. The file structure and organization remain the same, with clear comments and route descriptions.

To ensure this refactored version works correctly, make sure that:

1. The `ArcGISLayerRepository` class in `../repositories/arcgis-layer-repository.ts` implements all the methods used in this file with the correct signatures and functionality.

2. The dependency injection container is properly set up to resolve the `ArcGISLayerRepository` instance.

3. Any necessary database connection or configuration is handled within the repository class.

This refactored version should provide a cleaner separation of concerns, with the router focusing on handling HTTP requests and responses, while the repository handles all database operations. If you have any questions about specific parts of the code or need further assistance, please let me know.