/**
 * Model3D Repository Tests
 * Tests all database operations with security focus
 */

import { Pool } from "pg";

import { Model3DRepository, Model3DSearchParams } from "../../repositories/model3d.repository";

const mockQuery = jest.fn();
const mockPool = {
  query: mockQuery,
} as unknown as Pool;

describe("Model3DRepository", () => {
  let repository: Model3DRepository;

  beforeEach(() => {
    repository = new Model3DRepository(mockPool);
    mockQuery.mockClear();
  });

  describe("searchModels", () => {
    it("should use parameterized query for all filters", async () => {
      const params: Model3DSearchParams = {
        search: "jeep",
        vehicleType: "suv",
        make: "Jeep",
        source: "sketchfab",
        quality: "high",
        limit: 10,
        offset: 0,
      };

      mockQuery.mockResolvedValueOnce({ rows: [] });
      mockQuery.mockResolvedValueOnce({ rows: [{ count: "0" }] });

      await repository.searchModels(params);

      expect(mockQuery).toHaveBeenCalledTimes(2);
      const firstCall = mockQuery.mock.calls[0];
      const query = firstCall[0];
      const queryParams = firstCall[1];
      
      expect(query).toContain("$1");
      expect(Array.isArray(queryParams)).toBe(true);
    });
  });

  describe("findById", () => {
    it("should use parameterized query for ID lookup", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 1 }] });

      await repository.findById("1");

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining("$1"),
        ["1"]
      );
    });
  });

  describe("create", () => {
    it("should use parameterized query for all fields", async () => {
      const data = {
        name: "Test Model",
        file_url: "https://example.com/model.glb",
      };

      mockQuery.mockResolvedValueOnce({ rows: [{ id: 1 }] });

      await repository.create(data);

      const firstCall = mockQuery.mock.calls[0];
      const query = firstCall[0];
      
      expect(query).toContain("$1");
    });
  });
});
