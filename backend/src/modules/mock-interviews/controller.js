import { initializeCatalog, nextCatalogId, recordAdminAction } from '../../data/persistent-store.js';

const interviewTypes = ['Personal Interview', 'Tool Test'];
const publishingStatuses = ['draft', 'published'];

function sendError(response, status, message) {
  return response.status(status).json({ error: message });
}

function validateMockInterview(input, { requirePracticeFor = true } = {}) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return 'Request body must be a JSON object.';
  }
  if (!interviewTypes.includes(input.type)) {
    return 'type must be Personal Interview or Tool Test.';
  }
  if ((requirePracticeFor || input.practiceFor !== undefined)
    && (typeof input.practiceFor !== 'string' || !input.practiceFor.trim())) {
    return 'practiceFor is required.';
  }
  if (typeof input.interviewer !== 'string' || !input.interviewer.trim()) {
    return 'interviewer is required.';
  }
  if (!Number.isFinite(Number(input.price)) || Number(input.price) < 0) {
    return 'price must be a non-negative number.';
  }
  if (input.oldPrice !== undefined && (!Number.isFinite(Number(input.oldPrice)) || Number(input.oldPrice) < 0)) {
    return 'oldPrice must be a non-negative number.';
  }
  const imagePositionX = Number(input.imagePositionX ?? 50);
  const imagePositionY = Number(input.imagePositionY ?? 50);
  const imageZoom = Number(input.imageZoom ?? 1);
  if (!Number.isFinite(imagePositionX) || imagePositionX < 0 || imagePositionX > 100
    || !Number.isFinite(imagePositionY) || imagePositionY < 0 || imagePositionY > 100
    || !Number.isFinite(imageZoom) || imageZoom < 1 || imageZoom > 2) {
    return 'Image position and zoom settings are invalid.';
  }
  if (typeof input.image !== 'string' || !input.image.trim()) {
    return 'image is required.';
  }
  try {
    const imageUrl = new URL(input.image);
    if (!['http:', 'https:'].includes(imageUrl.protocol)) return 'image must be an HTTP or HTTPS URL.';
  } catch {
    return 'image must be a valid HTTP or HTTPS URL.';
  }
  if (input.status !== undefined && !publishingStatuses.includes(input.status)) {
    return 'status must be draft or published.';
  }
  return null;
}

function publicFields({ _id, ...interview }) {
  return interview;
}

export async function listPublishedMockInterviews(_request, response, next) {
  try {
    const database = await initializeCatalog();
    const interviews = await database.collection('mock_interviews')
      .find({ status: 'published' })
      .sort({ id: 1 })
      .toArray();
    response.json(interviews.map(publicFields));
  } catch (error) {
    next(error);
  }
}

export async function listAdminMockInterviews(_request, response, next) {
  try {
    const database = await initializeCatalog();
    const interviews = await database.collection('mock_interviews')
      .find()
      .sort({ id: 1 })
      .toArray();
    response.json(interviews.map(publicFields));
  } catch (error) {
    next(error);
  }
}

export async function createMockInterview(request, response, next) {
  try {
    const validationError = validateMockInterview(request.body);
    if (validationError) return sendError(response, 400, validationError);

    const database = await initializeCatalog();
    const interview = {
      id: await nextCatalogId('mock-interviews'),
      type: request.body.type,
      practiceFor: request.body.practiceFor.trim(),
      oldPrice: Number(request.body.oldPrice ?? request.body.price),
      price: Number(request.body.price),
      interviewer: request.body.interviewer.trim(),
      image: request.body.image.trim(),
      imagePositionX: Number(request.body.imagePositionX ?? 50),
      imagePositionY: Number(request.body.imagePositionY ?? 50),
      imageZoom: Number(request.body.imageZoom ?? 1),
      status: request.body.status || 'published',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await database.collection('mock_interviews').insertOne(interview);
    await recordAdminAction(request, 'mock_interview.created', 'mock_interview', interview.id, { type: interview.type });
    response.status(201).json(interview);
  } catch (error) {
    next(error);
  }
}

export async function updateMockInterview(request, response, next) {
  try {
    const id = Number(request.params.id);
    if (!Number.isSafeInteger(id) || id < 1) return sendError(response, 400, 'A valid mock interview ID is required.');

    const database = await initializeCatalog();
    const collection = database.collection('mock_interviews');
    const interview = await collection.findOne({ id });
    if (!interview) return sendError(response, 404, 'Mock interview not found.');
    if (!request.body || typeof request.body !== 'object' || Array.isArray(request.body)) {
      return sendError(response, 400, 'Request body must be a JSON object.');
    }

    const updated = {
      type: request.body.type ?? interview.type,
      oldPrice: request.body.oldPrice ?? interview.oldPrice ?? interview.price,
      price: request.body.price ?? interview.price,
      interviewer: request.body.interviewer ?? interview.interviewer,
      image: request.body.image ?? interview.image,
      imagePositionX: request.body.imagePositionX ?? interview.imagePositionX ?? 50,
      imagePositionY: request.body.imagePositionY ?? interview.imagePositionY ?? 50,
      imageZoom: request.body.imageZoom ?? interview.imageZoom ?? 1,
      status: request.body.status ?? interview.status,
    };
    const practiceFor = request.body.practiceFor ?? interview.practiceFor;
    if (practiceFor !== undefined) updated.practiceFor = practiceFor;
    const validationError = validateMockInterview(updated, { requirePracticeFor: updated.practiceFor !== undefined });
    if (validationError) return sendError(response, 400, validationError);

    const saved = {
      ...interview,
      ...updated,
      oldPrice: Number(updated.oldPrice),
      price: Number(updated.price),
      ...(updated.practiceFor !== undefined ? { practiceFor: updated.practiceFor.trim() } : {}),
      imagePositionX: Number(updated.imagePositionX),
      imagePositionY: Number(updated.imagePositionY),
      imageZoom: Number(updated.imageZoom),
      interviewer: updated.interviewer.trim(),
      image: updated.image.trim(),
      updatedAt: new Date(),
    };
    delete saved._id;
    await collection.updateOne({ id }, { $set: saved });
    await recordAdminAction(request, 'mock_interview.updated', 'mock_interview', id, { type: saved.type });
    response.json(saved);
  } catch (error) {
    next(error);
  }
}

export async function deleteMockInterview(request, response, next) {
  try {
    const id = Number(request.params.id);
    if (!Number.isSafeInteger(id) || id < 1) return sendError(response, 400, 'A valid mock interview ID is required.');

    const database = await initializeCatalog();
    const collection = database.collection('mock_interviews');
    const interview = await collection.findOne({ id });
    if (!interview) return sendError(response, 404, 'Mock interview not found.');
    await collection.deleteOne({ id });
    await recordAdminAction(request, 'mock_interview.deleted', 'mock_interview', id, { type: interview.type });
    response.status(204).end();
  } catch (error) {
    next(error);
  }
}
