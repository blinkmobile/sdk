import Joi from 'joi'
import { attachment } from '../common'
import {
  id,
  name,
  label,
  hint,
  required,
  readOnly,
  conditionallyShowSchemas,
  storageType,
} from '../property-schemas'

export const type = 'draw'

export default Joi.object({
  id,
  name,
  label,
  hint,
  required,
  readOnly,
  ...conditionallyShowSchemas,
  storageType,
  defaultValue: Joi.when('storageType', {
    is: Joi.valid('legacy', Joi.optional()),
    then: Joi.string().dataUri(),
    otherwise: attachment,
  }),
})
