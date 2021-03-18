import generateFormUrl from '../lib/generate-form-url'
import generateJWT from '../lib/generate-jwt'
import getSubmissionData from '../lib/retrieve-submission-data'
import OneBlinkAPI from '../lib/one-blink-api'
import setPreFillData from '../lib/pre-fill-data'
import { validateWithFormSchema } from '../lib/forms-validation'
import generateFormElement from '../lib/generate-form-element'
import generatePageElement from '../lib/generate-page-element'
import { encryptUserToken, decryptUserToken } from '../lib/user-token-helpers'
import { FormsAppsTypes, FormTypes, SubmissionTypes } from '@oneblink/types'
import {
  BaseSearchResult,
  Tenant,
  ConstructorOptions,
  PreFillMeta,
  FormRetrievalData,
} from '../lib/types'

type FormsSearchResult = {
  forms: FormTypes.Form[]
} & BaseSearchResult

type FormsSearchOptions = {
  isAuthenticated?: unknown
  name?: unknown
}

type FormSubmissionHistorySearchParameters = {
  formId: number
  submissionDateFrom?: string
  submissionDateTo?: string
  limit?: number
  offset?: number
}

type FormSubmissionHistorySearchResults = BaseSearchResult & {
  formSubmissionMeta: SubmissionTypes.FormSubmissionMeta[]
}

export default (tenant: Tenant) =>
  class Forms extends OneBlinkAPI {
    constructor(options: ConstructorOptions) {
      options = options || {}
      super(options.accessKey, options.secretKey, tenant)
    }

    async generateFormUrl(
      parameters?: Record<string, unknown>,
    ): Promise<{ expiry: string; formUrl: string }> {
      if (!parameters || typeof parameters !== 'object') {
        throw new TypeError('Parameters not provided.')
      }

      const expiryInSeconds = parameters.expiryInSeconds
      if (
        expiryInSeconds !== undefined &&
        typeof expiryInSeconds !== 'number'
      ) {
        throw new TypeError(
          'Must supply "expiryInSeconds" as a number or not at all',
        )
      }

      const externalId = parameters.externalId
      if (externalId && typeof externalId !== 'string') {
        throw new TypeError(
          'Must supply "externalId" as a string or not at all',
        )
      }

      const formId = parameters.formId
      if (typeof formId !== 'number') {
        throw new TypeError('Must supply "formId" as a number')
      }

      const previousFormSubmissionApprovalId =
        parameters.previousFormSubmissionApprovalId
      if (
        typeof previousFormSubmissionApprovalId !== 'string' &&
        previousFormSubmissionApprovalId !== undefined
      ) {
        throw new TypeError(
          'Must supply "previousFormSubmissionApprovalId" as a string or not at all',
        )
      }

      let formsAppId = parameters.formsAppId
      if (
        typeof formsAppId !== 'number' &&
        formsAppId !== undefined &&
        formsAppId !== null
      ) {
        throw new TypeError(
          'Must supply "formsAppId" as a number or not at all',
        )
      }

      if (typeof formsAppId !== 'number') {
        const form = await super.getRequest<FormTypes.Form>(`/forms/${formId}`)
        formsAppId = form.formsAppIds[0]
      }

      if (typeof formsAppId !== 'number') {
        throw new Error('This form has not been added to a forms app yet.')
      }

      const formsApp = await super.getRequest<FormsAppsTypes.FormsApp>(
        `/forms-apps/${formsAppId}`,
      )

      let preFillFormDataId
      if (parameters.preFillData) {
        const preFillMeta = await super.postRequest<undefined, PreFillMeta>(
          `/forms/${formId}/pre-fill-credentials`,
        )
        await setPreFillData(preFillMeta, parameters.preFillData)
        preFillFormDataId = preFillMeta.preFillFormDataId
      }

      // Default expiry for token is 8 hours
      const jwtExpiry = expiryInSeconds || 28800

      const token = generateJWT(this.accessKey, this.secretKey, jwtExpiry)

      let userToken = undefined
      const username = parameters.username
      if (
        username !== undefined &&
        username !== null &&
        typeof username !== 'string'
      ) {
        throw new TypeError('Must supply "username" as a string or not at all')
      }

      if (username) {
        const secret = parameters.secret
        if (typeof secret !== 'string') {
          throw new TypeError(
            'Must supply "secret" as a string if "username" is used',
          )
        }

        userToken = encryptUserToken({ secret, username })
      }

      const formUrl = generateFormUrl({
        formId,
        token,
        externalId,
        preFillFormDataId,
        endpoint: `https://${formsApp.hostname}/forms`,
        userToken,
        previousFormSubmissionApprovalId,
      })

      const expiry = new Date(Date.now() + jwtExpiry * 1000).toISOString()

      return {
        formUrl,
        expiry,
      }
    }

    async generateSubmissionDataUrl(
      formId?: unknown,
      submissionId?: unknown,
      expiryInSeconds?: unknown,
    ): Promise<{ url: string }> {
      if (typeof formId !== 'number') {
        return Promise.reject(new TypeError('Must supply "formId" as a number'))
      }
      if (typeof submissionId !== 'string') {
        return Promise.reject(
          new TypeError('Must supply "submissionId" as a string'),
        )
      }
      if (typeof expiryInSeconds !== 'number') {
        return Promise.reject(
          new TypeError('Must supply "expiryInSeconds" as a number'),
        )
      }
      if (expiryInSeconds < 900) {
        return Promise.reject(
          new TypeError(
            '"expiryInSeconds" must be greater than or equal to 900',
          ),
        )
      }

      return super.postRequest(
        `/forms/${formId}/retrieval-url/${submissionId}?expirySeconds=${expiryInSeconds}`,
      )
    }

    async getSubmissionData(
      formId?: unknown,
      submissionId?: unknown,
      isDraft?: unknown,
    ): Promise<SubmissionTypes.S3SubmissionData> {
      if (typeof formId !== 'number') {
        return Promise.reject(new TypeError('Must supply "formId" as a number'))
      }
      if (typeof submissionId !== 'string') {
        return Promise.reject(
          new TypeError('Must supply "submissionId" as a string'),
        )
      }

      let url = `/forms/${formId}/retrieval-credentials/${submissionId}`
      if (isDraft) {
        url = `/forms/${formId}/download-draft-data-credentials/${submissionId}`
      }

      const credentials = await super.postRequest<undefined, FormRetrievalData>(
        url,
      )
      return await getSubmissionData(credentials)
    }

    search(searchParams?: FormsSearchOptions): Promise<FormsSearchResult> {
      return super.searchRequest(`/forms`, searchParams)
    }

    searchSubmissions(
      options: FormSubmissionHistorySearchParameters,
    ): Promise<FormSubmissionHistorySearchResults> {
      let searchParams = {}

      if (typeof options.formId === 'number') {
        searchParams = Object.assign(searchParams, {
          formId: options.formId,
        })
      } else {
        throw new Error('formId must be a number and is required')
      }

      if (typeof options.submissionDateFrom === 'string') {
        searchParams = Object.assign(searchParams, {
          submissionDateFrom: options.submissionDateFrom,
        })
      }

      if (typeof options.submissionDateTo === 'string') {
        searchParams = Object.assign(searchParams, {
          submissionDateTo: options.submissionDateTo,
        })
      }

      searchParams = Object.assign(searchParams, {
        offset:
          typeof options.offset === 'number' ? Math.max(0, options.offset) : 0,
        limit:
          typeof options.limit === 'number'
            ? Math.max(1, options.limit)
            : undefined,
      })

      return super.searchRequest(`/form-submission-meta`, searchParams)
    }

    getForm(formId?: unknown, injectForms?: unknown): Promise<FormTypes.Form> {
      if (typeof formId !== 'number') {
        return Promise.reject(new TypeError('Must supply "formId" as a number'))
      }

      return super.searchRequest(`/forms/${formId}`, {
        injectForms: injectForms || false,
      })
    }

    async createForm(data?: unknown): Promise<FormTypes.Form> {
      const form = validateWithFormSchema(data)
      const savedForm = await super.postRequest<FormTypes.Form, FormTypes.Form>(
        '/forms',
        form,
      )
      return savedForm
    }

    async updateForm(
      data?: unknown,
      overrideLock?: unknown,
    ): Promise<FormTypes.Form> {
      const form = validateWithFormSchema(data)
      const savedForm = await super.putRequest<FormTypes.Form, FormTypes.Form>(
        `/forms/${form.id}${overrideLock ? '?overrideLock=true' : ''}`,
        form,
      )
      return savedForm
    }

    async deleteForm(formId?: unknown, overrideLock?: unknown): Promise<void> {
      if (typeof formId !== 'number') {
        throw new TypeError('Must supply "formId" as a number')
      }

      await super.deleteRequest(
        `/forms/${formId}${overrideLock ? '?overrideLock=true' : ''}`,
      )
    }

    static validateForm(form?: unknown): FormTypes.Form {
      const validatedForm = validateWithFormSchema(form)
      return validatedForm
    }

    static generateFormElement<T extends FormTypes._FormElementBase>(
      formElementGenerationData?: Record<string, unknown>,
    ): T {
      const formElement = generateFormElement<T>(formElementGenerationData)
      return formElement
    }

    static generatePageElement(
      formElementGenerationData?: Record<string, unknown>,
    ): FormTypes.PageElement {
      const pageElement = generatePageElement(formElementGenerationData)
      return pageElement
    }

    static encryptUserToken(details: { username: string; secret: string }) {
      return encryptUserToken(details)
    }

    static decryptUserToken(details: { userToken: string; secret: string }) {
      return decryptUserToken(details)
    }
  }