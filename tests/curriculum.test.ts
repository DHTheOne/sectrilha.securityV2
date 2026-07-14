import assert from 'node:assert/strict';
import test from 'node:test';
import {
  catalog,
  getCertification,
  getLevel,
  getLevelProgress,
  getResource,
  getSpecialization,
} from '../src/lib/curriculum/catalog.ts';

test('catalog has a continuous level sequence from 0 through 5', () => {
  assert.deepEqual(catalog.levels.map((level) => level.order), [0, 1, 2, 3, 4, 5]);
  assert.equal(catalog.levels.every((level) => level.checkpointIds.length > 0), true);
});

test('required static pages resolve their canonical curriculum records', () => {
  assert.equal(getLevel('level-0')?.id, 'level-0');
  assert.equal(getSpecialization('red-team')?.id, 'red-team');
  assert.equal(getCertification('oscp')?.slug, 'oscp');
  assert.equal(getResource('portswigger-academy')?.slug, 'portswigger-academy');
});

test('level progress is derived from required checkpoints', () => {
  const level = getLevel('level-0');
  assert.ok(level);
  const allComplete = new Set(level.checkpointIds);
  assert.deepEqual(getLevelProgress(level, allComplete), {
    completed: level.checkpointIds.length,
    total: level.checkpointIds.length,
    percent: 100,
  });
});

test('catalog links are secure, direct and internally consistent', () => {
  const resourceIds = new Set(catalog.resources.map((resource) => resource.id));
  const certificationIds = new Set(catalog.certifications.map((certification) => certification.id));

  for (const resource of catalog.resources) {
    assert.ok(resource.url?.startsWith('https://'), `resource ${resource.id} must use HTTPS`);
  }
  for (const certification of catalog.certifications) {
    assert.ok(certification.url?.startsWith('https://'), `certification ${certification.id} must use HTTPS`);
    certification.resourceIds.forEach((resourceId) => assert.ok(resourceIds.has(resourceId), `missing resource ${resourceId}`));
  }
  for (const module of catalog.modules) {
    module.resourceIds.forEach((resourceId) => assert.ok(resourceIds.has(resourceId), `missing resource ${resourceId}`));
  }
  for (const level of catalog.levels) {
    level.certificationIds.forEach((certificationId) => assert.ok(certificationIds.has(certificationId), `missing certification ${certificationId}`));
  }
  for (const specialization of catalog.specializations) {
    specialization.resourceIds.forEach((resourceId) => assert.ok(resourceIds.has(resourceId), `missing resource ${resourceId}`));
    specialization.certificationIds.forEach((certificationId) => assert.ok(certificationIds.has(certificationId), `missing certification ${certificationId}`));
  }
});

test('Portuguese resources are present across the foundational curriculum', () => {
  const portugueseResources = catalog.resources.filter((resource) => resource.languages.includes('pt-BR'));
  assert.ok(portugueseResources.length >= 20);
  assert.ok(portugueseResources.some((resource) => resource.id === 'curso-em-video-redes'));
  assert.ok(portugueseResources.some((resource) => resource.id === 'evg-cis-controls'));
  assert.ok(portugueseResources.some((resource) => resource.id === 'owasp-top-10-pt-br'));
});

test('the original Portuguese library remains available as the previous-content collection', () => {
  const previousResources = catalog.resources.filter((resource) => resource.collection === 'legacy');

  assert.equal(previousResources.length, 18);
  assert.equal(previousResources.every((resource) => resource.languages.includes('pt-BR')), true);
  assert.ok(previousResources.some((resource) => resource.id === 'curso-em-video-redes'));
  assert.ok(previousResources.some((resource) => resource.id === 'boson-nmap'));
  assert.equal(catalog.resources.every((resource) => resource.collection === 'legacy' || resource.collection === 'curated'), true);
});
