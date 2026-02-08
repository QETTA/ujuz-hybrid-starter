import { describe, it, expect, vi, beforeEach, afterEach, beforeAll, afterAll } from "vitest";
/**
 * UJUz - User Memory Service Unit Tests
 * 메모리 CRUD + 검색 검증
 */

import {
  saveMemory,
  getMemory,
  listMemories,
  updateMemory,
  deleteMemory,
  searchMemories,
  getMemoriesForBotContext,
} from '../userMemoryService.js';

// Mock MongoDB
const mockFindOne = vi.fn();
const mockFind = vi.fn();
const mockFindOneAndUpdate = vi.fn();
const mockUpdateOne = vi.fn();
const mockCountDocuments = vi.fn();
const mockSort = vi.fn();
const mockLimit = vi.fn();
const mockProject = vi.fn();
const mockToArray = vi.fn();

const mockCollection = vi.fn(() => ({
  findOne: mockFindOne,
  find: mockFind,
  findOneAndUpdate: mockFindOneAndUpdate,
  updateOne: mockUpdateOne,
  countDocuments: mockCountDocuments,
}));

const mockDb = { collection: mockCollection };

vi.mock('@ujuz/db', () => ({
  getMongoDb: vi.fn(() => mockDb),
  connectMongo: vi.fn(() => mockDb),
}));

vi.mock('@ujuz/config', () => ({
  env: {
    MONGODB_URI: 'mongodb://localhost:27017',
    MONGODB_DB_NAME: 'test_db',
  },
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

describe('UserMemoryService', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockFind.mockReturnValue({
      sort: mockSort,
    });
    mockSort.mockReturnValue({
      limit: mockLimit,
    });
    mockLimit.mockReturnValue({
      toArray: mockToArray,
      project: mockProject,
    });
    mockProject.mockReturnValue({
      toArray: mockToArray,
    });
  });

  describe('saveMemory', () => {
    it('should upsert a memory and return the document', async () => {
      const now = new Date();
      mockFindOneAndUpdate.mockResolvedValue({
        user_id: 'user-1',
        memory_key: 'checklist',
        content: 'Buy supplies',
        tags: ['todo'],
        metadata: {},
        is_active: true,
        created_at: now,
        updated_at: now,
      });

      const result = await saveMemory('user-1', 'checklist', 'Buy supplies', ['todo']);

      expect(mockCollection).toHaveBeenCalledWith('user_memories');
      expect(mockFindOneAndUpdate).toHaveBeenCalledWith(
        { user_id: 'user-1', memory_key: 'checklist' },
        expect.objectContaining({
          $set: expect.objectContaining({
            content: 'Buy supplies',
            tags: ['todo'],
            is_active: true,
          }),
          $setOnInsert: expect.objectContaining({
            user_id: 'user-1',
            memory_key: 'checklist',
          }),
        }),
        { upsert: true, returnDocument: 'after' },
      );
      expect(result.user_id).toBe('user-1');
      expect(result.memory_key).toBe('checklist');
      expect(result.content).toBe('Buy supplies');
    });

    it('should use empty defaults for tags and metadata', async () => {
      mockFindOneAndUpdate.mockResolvedValue({
        user_id: 'user-1',
        memory_key: 'note',
        content: 'Hello',
        tags: [],
        metadata: {},
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      });

      await saveMemory('user-1', 'note', 'Hello');

      expect(mockFindOneAndUpdate).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          $set: expect.objectContaining({ tags: [], metadata: {} }),
        }),
        expect.anything(),
      );
    });

    it('should throw when findOneAndUpdate returns null', async () => {
      mockFindOneAndUpdate.mockResolvedValue(null);

      await expect(saveMemory('user-1', 'key', 'content'))
        .rejects.toThrow('Failed to save memory');
    });
  });

  describe('getMemory', () => {
    it('should return memory when found', async () => {
      mockFindOne.mockResolvedValue({
        user_id: 'user-1',
        memory_key: 'checklist',
        content: 'Items',
        tags: [],
        metadata: {},
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      });

      const result = await getMemory('user-1', 'checklist');

      expect(mockFindOne).toHaveBeenCalledWith({
        user_id: 'user-1',
        memory_key: 'checklist',
        is_active: true,
      });
      expect(result).not.toBeNull();
      expect(result!.content).toBe('Items');
    });

    it('should return null when not found', async () => {
      mockFindOne.mockResolvedValue(null);

      const result = await getMemory('user-1', 'nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('listMemories', () => {
    it('should list active memories sorted by updated_at', async () => {
      const docs = [
        { user_id: 'user-1', memory_key: 'a', content: 'A', tags: [], metadata: {}, is_active: true, created_at: new Date(), updated_at: new Date() },
        { user_id: 'user-1', memory_key: 'b', content: 'B', tags: [], metadata: {}, is_active: true, created_at: new Date(), updated_at: new Date() },
      ];
      mockToArray.mockResolvedValue(docs);
      mockCountDocuments.mockResolvedValue(2);

      const result = await listMemories('user-1');

      expect(mockFind).toHaveBeenCalledWith({ user_id: 'user-1', is_active: true });
      expect(result.memories).toHaveLength(2);
      expect(result.total).toBe(2);
    });

    it('should filter by tag when provided', async () => {
      mockToArray.mockResolvedValue([]);
      mockCountDocuments.mockResolvedValue(0);

      await listMemories('user-1', 'facility');

      expect(mockFind).toHaveBeenCalledWith({
        user_id: 'user-1',
        is_active: true,
        tags: 'facility',
      });
    });

    it('should respect limit parameter', async () => {
      mockToArray.mockResolvedValue([]);
      mockCountDocuments.mockResolvedValue(0);

      await listMemories('user-1', undefined, 5);

      expect(mockLimit).toHaveBeenCalledWith(5);
    });
  });

  describe('updateMemory', () => {
    it('should update content and return updated doc', async () => {
      mockFindOneAndUpdate.mockResolvedValue({
        user_id: 'user-1',
        memory_key: 'note',
        content: 'Updated content',
        tags: ['updated'],
        metadata: {},
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      });

      const result = await updateMemory('user-1', 'note', 'Updated content', ['updated']);

      expect(mockFindOneAndUpdate).toHaveBeenCalledWith(
        { user_id: 'user-1', memory_key: 'note', is_active: true },
        { $set: expect.objectContaining({ content: 'Updated content', tags: ['updated'] }) },
        { returnDocument: 'after' },
      );
      expect(result!.content).toBe('Updated content');
    });

    it('should return null when memory not found', async () => {
      mockFindOneAndUpdate.mockResolvedValue(null);

      const result = await updateMemory('user-1', 'missing', 'content');
      expect(result).toBeNull();
    });
  });

  describe('deleteMemory', () => {
    it('should soft delete and return true', async () => {
      mockUpdateOne.mockResolvedValue({ modifiedCount: 1 });

      const result = await deleteMemory('user-1', 'note');

      expect(mockUpdateOne).toHaveBeenCalledWith(
        { user_id: 'user-1', memory_key: 'note', is_active: true },
        { $set: expect.objectContaining({ is_active: false }) },
      );
      expect(result).toBe(true);
    });

    it('should return false when memory not found', async () => {
      mockUpdateOne.mockResolvedValue({ modifiedCount: 0 });

      const result = await deleteMemory('user-1', 'missing');
      expect(result).toBe(false);
    });
  });

  describe('searchMemories', () => {
    it('should search by regex in content, key, and tags', async () => {
      mockToArray.mockResolvedValue([
        { user_id: 'user-1', memory_key: 'checklist', content: 'Buy milk', tags: ['shopping'], metadata: {}, is_active: true, created_at: new Date(), updated_at: new Date() },
      ]);

      const result = await searchMemories('user-1', 'milk');

      expect(mockFind).toHaveBeenCalledWith(expect.objectContaining({
        user_id: 'user-1',
        is_active: true,
        $or: expect.arrayContaining([
          expect.objectContaining({ content: { $regex: 'milk', $options: 'i' } }),
        ]),
      }));
      expect(result).toHaveLength(1);
    });

    it('should escape regex special characters', async () => {
      mockToArray.mockResolvedValue([]);

      await searchMemories('user-1', 'test.value');

      expect(mockFind).toHaveBeenCalledWith(expect.objectContaining({
        $or: expect.arrayContaining([
          expect.objectContaining({ content: { $regex: 'test\\.value', $options: 'i' } }),
        ]),
      }));
    });
  });

  describe('getMemoriesForBotContext', () => {
    it('should return key+snippet pairs', async () => {
      mockToArray.mockResolvedValue([
        { memory_key: 'note1', content: 'Short content' },
        { memory_key: 'note2', content: 'A'.repeat(300) },
      ]);

      const result = await getMemoriesForBotContext('user-1');

      expect(result).toHaveLength(2);
      expect(result[0].key).toBe('note1');
      expect(result[0].snippet).toBe('Short content');
      expect(result[1].snippet).toHaveLength(200);
    });

    it('should return empty array on error', async () => {
      mockFind.mockImplementation(() => { throw new Error('DB error'); });

      const result = await getMemoriesForBotContext('user-1');
      expect(result).toEqual([]);
    });
  });
});
