/**
 * Domain types for the curriculum catalog.  Display copy is deliberately kept
 * as an i18n reference plus a Portuguese fallback so the catalog can be used
 * before the translation files are loaded.
 */

export const SUPPORTED_LOCALES = ['pt-BR', 'en-US', 'es-ES'] as const;

export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];
export type TranslationKey = `curriculum.${string}`;

export interface I18nText {
  /** Stable key consumed by the application translation layer. */
  readonly key: TranslationKey;
  /** Portuguese fallback used for SSR, offline mode, and missing translations. */
  readonly fallback: string;
}

export type LevelId =
  | 'level-0'
  | 'level-1'
  | 'level-2'
  | 'level-3'
  | 'level-4'
  | 'level-5';

export type SpecializationId =
  | 'red-team'
  | 'blue-team'
  | 'dfir'
  | 'threat-hunting'
  | 'detection-engineering'
  | 'cloud-security'
  | 'appsec-devsecops'
  | 'malware-reverse-engineering'
  | 'hardware-iot';

export type ResourceType =
  | 'course'
  | 'book'
  | 'video'
  | 'lab'
  | 'platform'
  | 'tool'
  | 'guide'
  | 'framework'
  | 'community'
  | 'ctf'
  | 'hardware';

export type ResourceAccess = 'free' | 'freemium' | 'paid' | 'reference';

/**
 * `legacy` identifies material that was already part of the original learning
 * library. Everything newly curated is kept in the `curated` collection so
 * learners can deliberately choose between the two.
 */
export type ResourceCollection = 'legacy' | 'curated';

export type CheckpointEvidence =
  | 'lab'
  | 'project'
  | 'report'
  | 'certification'
  | 'explanation'
  | 'portfolio'
  | 'contribution';

export type CertificationRecognition =
  | 'foundational'
  | 'professional'
  | 'advanced'
  | 'specialist';

export type CertificationCostBand = 'low' | 'medium' | 'high' | 'premium';

export type PrerequisiteTargetType =
  | 'level'
  | 'module'
  | 'checkpoint'
  | 'certification';

export interface Prerequisite {
  readonly targetType: PrerequisiteTargetType;
  readonly targetId: string;
  readonly isRequired: boolean;
  readonly note?: I18nText;
}

export interface DurationRange {
  readonly minWeeks: number;
  readonly maxWeeks: number;
}

export interface CurriculumLevel {
  readonly id: LevelId;
  readonly order: number;
  readonly slug: string;
  readonly title: I18nText;
  readonly summary: I18nText;
  readonly duration: DurationRange;
  readonly prerequisites: readonly Prerequisite[];
  readonly moduleIds: readonly string[];
  readonly checkpointIds: readonly string[];
  readonly certificationIds: readonly string[];
  readonly specializationIds: readonly SpecializationId[];
  readonly badge: {
    readonly id: string;
    readonly label: I18nText;
  };
}

export interface CurriculumModule {
  readonly id: string;
  readonly slug: string;
  readonly levelId: LevelId;
  readonly specializationIds: readonly SpecializationId[];
  readonly title: I18nText;
  readonly summary: I18nText;
  readonly learningObjectives: readonly I18nText[];
  readonly skillIds: readonly string[];
  readonly estimatedHours: number;
  readonly prerequisites: readonly Prerequisite[];
  readonly resourceIds: readonly string[];
  readonly checkpointIds: readonly string[];
}

export interface CurriculumResource {
  readonly id: string;
  /** URL-safe, unique identifier for static resource pages. */
  readonly slug: string;
  readonly title: I18nText;
  readonly description: I18nText;
  readonly provider: string;
  readonly url?: string;
  readonly type: ResourceType;
  readonly access: ResourceAccess;
  readonly collection: ResourceCollection;
  readonly languages: readonly SupportedLocale[];
  readonly estimatedHours?: number;
  readonly levelIds: readonly LevelId[];
  readonly specializationIds: readonly SpecializationId[];
  readonly tags: readonly string[];
}

export interface CurriculumCheckpoint {
  readonly id: string;
  readonly levelId: LevelId;
  readonly moduleId?: string;
  readonly specializationIds: readonly SpecializationId[];
  readonly title: I18nText;
  readonly description: I18nText;
  readonly evidence: CheckpointEvidence;
  readonly isRequired: boolean;
  readonly prerequisites: readonly Prerequisite[];
}

export interface CurriculumCertification {
  readonly id: string;
  /** URL-safe, unique identifier for static certification pages. */
  readonly slug: string;
  readonly name: I18nText;
  readonly provider: string;
  readonly description: I18nText;
  readonly recognition: CertificationRecognition;
  /** Broad band instead of a volatile exact price. */
  readonly costBand: CertificationCostBand;
  readonly estimatedStudyHours?: number;
  readonly url?: string;
  readonly levelIds: readonly LevelId[];
  readonly specializationIds: readonly SpecializationId[];
  readonly prerequisites: readonly Prerequisite[];
  readonly resourceIds: readonly string[];
}

export interface SkillDefinition {
  readonly id: string;
  readonly title: I18nText;
  readonly description: I18nText;
}

export interface SpecializationSkillTarget {
  readonly skillId: string;
  /** 1 = exposure, 5 = independent professional practice. */
  readonly targetProficiency: 1 | 2 | 3 | 4 | 5;
}

export interface CurriculumSpecialization {
  readonly id: SpecializationId;
  readonly slug: string;
  readonly title: I18nText;
  readonly summary: I18nText;
  readonly prerequisites: readonly Prerequisite[];
  readonly levelIds: readonly LevelId[];
  readonly moduleIds: readonly string[];
  readonly resourceIds: readonly string[];
  readonly checkpointIds: readonly string[];
  readonly certificationIds: readonly string[];
  readonly skillTargets: readonly SpecializationSkillTarget[];
}

export interface CurriculumMetadata {
  readonly id: 'cybersecurity-learning-roadmap';
  readonly version: string;
  readonly sourceUpdatedAt: string;
  readonly license: string;
  readonly title: I18nText;
  readonly description: I18nText;
}

export interface CurriculumCatalog {
  readonly metadata: CurriculumMetadata;
  readonly levels: readonly CurriculumLevel[];
  readonly modules: readonly CurriculumModule[];
  readonly resources: readonly CurriculumResource[];
  readonly checkpoints: readonly CurriculumCheckpoint[];
  readonly certifications: readonly CurriculumCertification[];
  readonly specializations: readonly CurriculumSpecialization[];
  readonly skills: readonly SkillDefinition[];
}

export interface LearnerCurriculumProgress {
  readonly completedCheckpointIds: readonly string[];
  readonly completedModuleIds: readonly string[];
  readonly earnedCertificationIds: readonly string[];
}
