# Remediation Strategy: TypeScript Config

# Remediation Strategy

## Root Cause Analysis
The issue appears to be a result of improperly formatted JSON in the `tsconfig.json` files. JSON requires property names to be double-quoted, which is not the case at the specified positions in these files. The recommendation to enable "strict" and "noEmitOnError" is a best practice in TypeScript development to catch and prevent errors during the compile time.

## Remediation Approach
1. Identify and correct the JSON formatting issues in the `tsconfig.json` files.
2. Enable "strict" and "noEmitOnError" in the `tsconfig.json` files.

## Implementation Details
1. Open the `tsconfig.json` file located at `/Users/andrewmorton/Documents/GitHub/Fleet`.
2. Locate the JSON property at position 311 (line 14 column 5) and ensure the property name is double-quoted.
3. Repeat steps 1 and 2 for the `api/tsconfig.json` file, correcting the property at position 150 (line 8 column 5).
4. In both `tsconfig.json` files, locate or add the `compilerOptions` property.
5. Within `compilerOptions`, set `"strict": true` and `"noEmitOnError": true`.

The corrected `compilerOptions` section should look like this:

```json
"compilerOptions": {
    "strict": true,
    "noEmitOnError": true,
    // other options...
}
```

## Verification Steps
1. Use a JSON validator tool to confirm that the `tsconfig.json` files are now correctly formatted.
2. Run the TypeScript compiler on your codebase. It should now fail on compile-time errors due to the "strict" and "noEmitOnError" settings.
3. Resolve any compile-time errors that are flagged, then re-run the compiler. The compile should now succeed without errors.

## Risk Assessment
The main risk is that enabling "strict" mode may reveal previously unnoticed type errors in the codebase. This could require additional time to resolve these issues. However, this is a beneficial process as it improves code quality and reduces the likelihood of runtime errors. Mitigate this risk by allocating sufficient time for code fixes and testing after enabling "strict" mode.