import Joi from 'joi'
import elementSchema from './element-schema'
import {
  conditionallyShowPredicates,
  ConditionalPredicatesItemSchema,
} from './property-schemas'
const postSubmissionActions = ['BACK', 'URL', 'CLOSE', 'FORMS_LIBRARY']

const pdfSubmissionEventConfiguration = {
  pdfFileName: Joi.string().allow(null, ''),
  includeSubmissionIdInPdf: Joi.boolean(),
  excludedElementIds: Joi.array()
    .items(Joi.string().guid())
    .unique()
    .allow(null)
    .default([]),
}

const SubmissionEventsSchema = Joi.object().keys({
  isDraft: Joi.boolean().default(false),
  type: Joi.string()
    .required()
    .valid(
      'CALLBACK',
      'PDF',
      'ONEBLINK_API',
      'TRIM',
      'CP_PAY',
      'CP_HCMS',
      'BPOINT',
      'WESTPAC_QUICK_WEB',
      'CIVICA_CRM',
      'SCHEDULING',
    ),
  configuration: Joi.object()
    .required()
    .when('type', {
      is: 'CALLBACK',
      then: Joi.object().keys({
        url: Joi.string().uri().required(),
        secret: Joi.string().required(),
      }),
    })
    .when('type', {
      is: 'PDF',
      then: Joi.object().keys({
        email: Joi.alternatives([
          Joi.string().email().required(),
          Joi.string()
            .regex(/^{ELEMENT:\S+}$/)
            .required(),
        ]),
        emailSubjectLine: Joi.string().allow(null, ''),
        ...pdfSubmissionEventConfiguration,
      }),
    })
    .when('type', {
      is: 'ONEBLINK_API',
      then: Joi.object().keys({
        apiId: Joi.string().required(),
        apiEnvironment: Joi.string().required(),
        apiEnvironmentRoute: Joi.string().required(),
        secret: Joi.string().required(),
      }),
    })
    .when('type', {
      is: 'TRIM',
      then: Joi.object().keys({
        environmentId: Joi.string().uuid().required(),
        recordTitle: Joi.string().allow(null, ''),
        container: Joi.object().keys({
          uri: Joi.number().required(),
          label: Joi.string().required(),
        }),
        recordType: Joi.object().keys({
          uri: Joi.number().required(),
          label: Joi.string().required(),
        }),
        actionDefinition: Joi.object().keys({
          uri: Joi.number().required(),
          label: Joi.string().required(),
        }),
        location: Joi.object().keys({
          uri: Joi.number().required(),
          label: Joi.string().required(),
        }),
        includeSubmissionIdInPdf:
          pdfSubmissionEventConfiguration.includeSubmissionIdInPdf,
        author: Joi.object()
          .keys({
            uri: Joi.number().required(),
            label: Joi.string().required(),
          })
          .allow(null),
      }),
    })
    .when('type', {
      is: 'BPOINT',
      then: Joi.object().keys({
        elementId: Joi.string().uuid().required(),
        environmentId: Joi.string().uuid().required(),
        crn2: Joi.string(),
        crn3: Joi.string(),
      }),
    })
    .when('type', {
      is: 'WESTPAC_QUICK_WEB',
      then: Joi.object().keys({
        elementId: Joi.string().uuid().required(),
        environmentId: Joi.string().uuid().required(),
        customerReferenceNumber: Joi.string().required(),
      }),
    })
    .when('type', {
      is: 'CP_PAY',
      then: Joi.object().keys({
        elementId: Joi.string().uuid().required(),
        gatewayId: Joi.string().uuid().required(),
      }),
    })
    .when('type', {
      is: 'CIVICA_CRM',
      then: Joi.object().keys({
        environmentId: Joi.string().uuid().required(),
        civicaDescription: Joi.string().required(),
        civicaCustomerContactMethod: Joi.object({
          code: Joi.string().required(),
          description: Joi.string().required(),
        }).required(),
        civicaCategory: Joi.object({
          id: Joi.number().required(),
          label: Joi.string().required(),
        }).required(),
        mapping: Joi.array()
          .required()
          .min(1)
          .unique('civicaCategoryItemNumber')
          .items(
            Joi.object({
              civicaCategoryItemNumber: Joi.number().required(),
              formElementId: Joi.string().uuid().required(),
            }),
          ),
        ...pdfSubmissionEventConfiguration,
      }),
    })
    .when('type', {
      is: 'CP_HCMS',
      then: Joi.object().keys({
        contentTypeName: Joi.string()
          .regex(/^[a-z0-9-]+$/)
          .required()
          .max(40),
        encryptedElementIds: Joi.array()
          .items(Joi.string().guid())
          .unique()
          .allow(null),
        encryptPdf: Joi.boolean().default(false),
      }),
    })
    .when('type', {
      is: 'SCHEDULING',
      then: Joi.object().keys({
        nylasAccountId: Joi.string().required(),
        nylasSchedulingPageId: Joi.number().required(),
        nameElementId: Joi.string().guid(),
        emailElementId: Joi.string().guid(),
        emailDescription: Joi.string(),
      }),
    }),
  conditionallyExecute: Joi.bool().default(false),
  requiresAllConditionallyExecutePredicates: Joi.bool().default(false),
  conditionallyExecutePredicates: Joi.when('conditionallyExecute', {
    is: true,
    then: Joi.array()
      .unique('elementId')
      .min(1)
      .items(ConditionalPredicatesItemSchema)
      .required(),
    otherwise: Joi.any().strip(),
  }),
})

const pageElementSchema = Joi.object().keys({
  id: Joi.string().guid().required(),
  label: Joi.string().required(),
  type: Joi.valid('page'),
  conditionallyShow: Joi.bool().default(false),
  conditionallyShowPredicates: conditionallyShowPredicates,
  requiresAllConditionallyShowPredicates: Joi.bool().default(false),
  elements: Joi.array()
    .required()
    .items(elementSchema)
    .min(1)
    .unique('name', { ignoreUndefined: true })
    .unique('id'),
})

const formSchema = Joi.object().keys({
  id: Joi.number(),
  formsAppEnvironmentId: Joi.number().required(),
  name: Joi.string().required(),
  description: Joi.string().allow('', null),
  organisationId: Joi.string().required(),
  elements: Joi.array().when('isMultiPage', {
    is: false,
    then: Joi.array()
      .required()
      .items(elementSchema)
      .unique('name', { ignoreUndefined: true })
      .unique('id'),
    otherwise: Joi.array().items(pageElementSchema),
  }),
  isMultiPage: Joi.bool().default(false),
  isAuthenticated: Joi.bool().default(false),
  publishStartDate: Joi.string().isoDate(),
  publishEndDate: Joi.string().isoDate(),
  submissionEvents: Joi.array().allow(null).items(SubmissionEventsSchema),
  postSubmissionAction: Joi.string()
    .required()
    .valid(...postSubmissionActions),
  redirectUrl: Joi.when('postSubmissionAction', {
    is: 'URL',
    then: Joi.string().required(),
    otherwise: Joi.any().strip(),
  }),
  cancelAction: Joi.string()
    .default('BACK')
    .valid(...postSubmissionActions),
  cancelRedirectUrl: Joi.when('cancelAction', {
    is: 'URL',
    then: Joi.string().required(),
    otherwise: Joi.any().strip(),
  }),
  isInfoPage: Joi.bool().default(false),
  formsAppIds: Joi.array().items(Joi.number()).required(),
  createdAt: Joi.string().allow('', null),
  updatedAt: Joi.string().allow('', null),
  // TAGS
  tags: Joi.array().default([]).items(Joi.string()),
})

export { formSchema, elementSchema, pageElementSchema }
