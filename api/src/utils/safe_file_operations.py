"""
Safe File Operations Utility (Python)

Prevents path traversal attacks and file inclusion vulnerabilities by:
1. Validating that resolved paths are within allowed directories
2. Sanitizing user input to remove ../, absolute paths, etc.
3. Providing safe wrappers around file operations

SECURITY: Always use these functions when dealing with user-provided file paths
"""

import os
from pathlib import Path
from typing import Union, BinaryIO, TextIO, Optional


class PathTraversalError(Exception):
    """Security error for path traversal attempts"""
    def __init__(self, attempted_path: str, allowed_directory: str):
        super().__init__(
            f'Path traversal detected: "{attempted_path}" is outside '
            f'allowed directory "{allowed_directory}"'
        )
        self.attempted_path = attempted_path
        self.allowed_directory = allowed_directory


def validate_path_within_directory(
    file_path: str,
    allowed_directory: str
) -> str:
    """
    Validate that a resolved path is within an allowed directory.
    Prevents path traversal attacks using ../ or absolute paths.

    Args:
        file_path: The file path to validate (can be relative)
        allowed_directory: The base directory that file_path must be within

    Returns:
        The validated absolute path

    Raises:
        PathTraversalError: If the path is outside the allowed directory
    """
    # Resolve both paths to absolute paths
    resolved_allowed_dir = os.path.abspath(allowed_directory)

    # If file_path is absolute, resolve it directly
    # Otherwise, resolve it relative to allowed_directory
    if os.path.isabs(file_path):
        resolved_path = os.path.abspath(file_path)
    else:
        resolved_path = os.path.abspath(os.path.join(allowed_directory, file_path))

    # Use commonpath to check if resolved_path is under resolved_allowed_dir
    try:
        common_path = os.path.commonpath([resolved_allowed_dir, resolved_path])
    except ValueError:
        # Paths are on different drives (Windows)
        raise PathTraversalError(file_path, allowed_directory)

    # Check if the common path is the allowed directory
    if common_path != resolved_allowed_dir:
        raise PathTraversalError(file_path, allowed_directory)

    # Additional check: ensure resolved_path starts with resolved_allowed_dir
    if not resolved_path.startswith(resolved_allowed_dir + os.sep) and resolved_path != resolved_allowed_dir:
        raise PathTraversalError(file_path, allowed_directory)

    return resolved_path


def sanitize_file_path(file_path: str) -> str:
    """
    Sanitize a file path by removing dangerous patterns.
    Removes: ../, absolute paths, null bytes

    Args:
        file_path: The file path to sanitize

    Returns:
        Sanitized file path

    Raises:
        ValueError: If file path is empty
    """
    if not file_path:
        raise ValueError("File path cannot be empty")

    # Remove null bytes
    sanitized = file_path.replace('\0', '')

    # Remove leading slashes (prevent absolute paths)
    sanitized = sanitized.lstrip('/\\')

    # Normalize path separators
    sanitized = sanitized.replace('\\', '/')

    # Remove parent directory references and empty parts
    parts = [part for part in sanitized.split('/') if part and part not in ('..', '.')]

    return '/'.join(parts)


def safe_read_file(
    file_path: str,
    allowed_directory: str,
    mode: str = 'r',
    encoding: Optional[str] = 'utf-8',
    **kwargs
) -> Union[str, bytes]:
    """
    Safely read a file - ensures path is within allowed directory.

    Args:
        file_path: The file path to read (relative to allowed_directory)
        allowed_directory: The base directory that file_path must be within
        mode: File mode ('r' for text, 'rb' for binary)
        encoding: Text encoding (only used for text mode)
        **kwargs: Additional arguments for open()

    Returns:
        File contents as string (text mode) or bytes (binary mode)

    Raises:
        PathTraversalError: If path is outside allowed directory
        FileNotFoundError: If file doesn't exist
        PermissionError: If file is not readable
    """
    validated_path = validate_path_within_directory(file_path, allowed_directory)

    # Check if file exists and is readable
    if not os.path.exists(validated_path):
        raise FileNotFoundError(f"File not found: {file_path}")

    if not os.access(validated_path, os.R_OK):
        raise PermissionError(f"File not readable: {file_path}")

    # Read file
    if 'b' in mode:
        with open(validated_path, mode, **kwargs) as f:
            return f.read()
    else:
        with open(validated_path, mode, encoding=encoding, **kwargs) as f:
            return f.read()


def safe_write_file(
    file_path: str,
    allowed_directory: str,
    content: Union[str, bytes],
    mode: str = 'w',
    encoding: Optional[str] = 'utf-8',
    **kwargs
) -> None:
    """
    Safely write to a file - ensures path is within allowed directory.

    Args:
        file_path: The file path to write (relative to allowed_directory)
        allowed_directory: The base directory that file_path must be within
        content: Content to write (string for text mode, bytes for binary mode)
        mode: File mode ('w' for text, 'wb' for binary)
        encoding: Text encoding (only used for text mode)
        **kwargs: Additional arguments for open()

    Raises:
        PathTraversalError: If path is outside allowed directory
        PermissionError: If file is not writable
    """
    validated_path = validate_path_within_directory(file_path, allowed_directory)

    # Ensure parent directory exists
    parent_dir = os.path.dirname(validated_path)
    os.makedirs(parent_dir, exist_ok=True)

    # Write file
    if 'b' in mode:
        with open(validated_path, mode, **kwargs) as f:
            f.write(content)
    else:
        with open(validated_path, mode, encoding=encoding, **kwargs) as f:
            f.write(content)


def safe_open_file(
    file_path: str,
    allowed_directory: str,
    mode: str = 'r',
    encoding: Optional[str] = 'utf-8',
    **kwargs
) -> Union[TextIO, BinaryIO]:
    """
    Safely open a file - ensures path is within allowed directory.
    Returns a file handle that must be closed by the caller.

    Args:
        file_path: The file path to open (relative to allowed_directory)
        allowed_directory: The base directory that file_path must be within
        mode: File mode ('r', 'w', 'rb', 'wb', etc.)
        encoding: Text encoding (only used for text mode)
        **kwargs: Additional arguments for open()

    Returns:
        File handle

    Raises:
        PathTraversalError: If path is outside allowed directory
        FileNotFoundError: If file doesn't exist (read modes)
        PermissionError: If file is not accessible
    """
    validated_path = validate_path_within_directory(file_path, allowed_directory)

    # For read modes, check if file exists
    if 'r' in mode and not os.path.exists(validated_path):
        raise FileNotFoundError(f"File not found: {file_path}")

    # For write modes, ensure parent directory exists
    if 'w' in mode or 'a' in mode:
        parent_dir = os.path.dirname(validated_path)
        os.makedirs(parent_dir, exist_ok=True)

    # Open and return file handle
    if 'b' in mode:
        return open(validated_path, mode, **kwargs)
    else:
        return open(validated_path, mode, encoding=encoding, **kwargs)


def safe_delete_file(
    file_path: str,
    allowed_directory: str
) -> None:
    """
    Safely delete a file - ensures path is within allowed directory.

    Args:
        file_path: The file path to delete (relative to allowed_directory)
        allowed_directory: The base directory that file_path must be within

    Raises:
        PathTraversalError: If path is outside allowed directory
        FileNotFoundError: If file doesn't exist
        PermissionError: If file cannot be deleted
    """
    validated_path = validate_path_within_directory(file_path, allowed_directory)

    if not os.path.exists(validated_path):
        raise FileNotFoundError(f"File not found: {file_path}")

    os.remove(validated_path)


def safe_file_exists(
    file_path: str,
    allowed_directory: str
) -> bool:
    """
    Safely check if a file exists - ensures path is within allowed directory.

    Args:
        file_path: The file path to check (relative to allowed_directory)
        allowed_directory: The base directory that file_path must be within

    Returns:
        True if file exists, False otherwise

    Raises:
        PathTraversalError: If path is outside allowed directory
    """
    try:
        validated_path = validate_path_within_directory(file_path, allowed_directory)
        return os.path.exists(validated_path)
    except PathTraversalError:
        return False


def safe_get_file_stats(
    file_path: str,
    allowed_directory: str
) -> os.stat_result:
    """
    Safely get file stats - ensures path is within allowed directory.

    Args:
        file_path: The file path to stat (relative to allowed_directory)
        allowed_directory: The base directory that file_path must be within

    Returns:
        os.stat_result object

    Raises:
        PathTraversalError: If path is outside allowed directory
        FileNotFoundError: If file doesn't exist
    """
    validated_path = validate_path_within_directory(file_path, allowed_directory)

    if not os.path.exists(validated_path):
        raise FileNotFoundError(f"File not found: {file_path}")

    return os.stat(validated_path)


def safe_copy_file(
    source_path: str,
    dest_path: str,
    allowed_directory: str
) -> None:
    """
    Safely copy a file - ensures both paths are within allowed directory.

    Args:
        source_path: Source file path (relative to allowed_directory)
        dest_path: Destination file path (relative to allowed_directory)
        allowed_directory: The base directory that both paths must be within

    Raises:
        PathTraversalError: If either path is outside allowed directory
        FileNotFoundError: If source file doesn't exist
    """
    import shutil

    validated_source = validate_path_within_directory(source_path, allowed_directory)
    validated_dest = validate_path_within_directory(dest_path, allowed_directory)

    if not os.path.exists(validated_source):
        raise FileNotFoundError(f"Source file not found: {source_path}")

    # Ensure destination directory exists
    parent_dir = os.path.dirname(validated_dest)
    os.makedirs(parent_dir, exist_ok=True)

    shutil.copy2(validated_source, validated_dest)


def safe_move_file(
    source_path: str,
    dest_path: str,
    allowed_directory: str
) -> None:
    """
    Safely move/rename a file - ensures both paths are within allowed directory.

    Args:
        source_path: Source file path (relative to allowed_directory)
        dest_path: Destination file path (relative to allowed_directory)
        allowed_directory: The base directory that both paths must be within

    Raises:
        PathTraversalError: If either path is outside allowed directory
        FileNotFoundError: If source file doesn't exist
    """
    import shutil

    validated_source = validate_path_within_directory(source_path, allowed_directory)
    validated_dest = validate_path_within_directory(dest_path, allowed_directory)

    if not os.path.exists(validated_source):
        raise FileNotFoundError(f"Source file not found: {source_path}")

    # Ensure destination directory exists
    parent_dir = os.path.dirname(validated_dest)
    os.makedirs(parent_dir, exist_ok=True)

    shutil.move(validated_source, validated_dest)


def get_safe_file_path(
    file_path: str,
    allowed_directory: str
) -> str:
    """
    Get safe file path - validates and returns the absolute path.
    Useful when you need the validated path for other operations.

    Args:
        file_path: The file path to validate (relative to allowed_directory)
        allowed_directory: The base directory that file_path must be within

    Returns:
        Validated absolute file path

    Raises:
        PathTraversalError: If path is outside allowed directory
    """
    return validate_path_within_directory(file_path, allowed_directory)
