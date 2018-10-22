// @flow
'use strict'

/* ::
import type {
  ConstructorOptions,
  Organisation
} from '../types.js'
*/

const OneBlinkAPI = require('../lib/one-blink-api.js')

module.exports = class Organisations extends OneBlinkAPI {
  constructor (
    options /* : ConstructorOptions */
  ) {
    options = options || {}
    super(
      options.oneBlinkAPIOrigin,
      options.accessKey,
      options.secretKey
    )
  }

  getOrganisation (organisationId /* : ?mixed */) /* : Promise<Organisation> */ {
    if (typeof organisationId !== 'string') {
      return Promise.reject(new TypeError('Must supply "organisationId" as a string'))
    }

    return super.getRequest(`/organisations/${organisationId}`)
  }
}
