import * as core from '@actions/core'

export async function run(): Promise<void> {
  try {
    const privateKey = core.getInput('private_key', { required: true })
    const variables = core.getInput('variables')
    const expandAll = core.getBooleanInput('expand_all')

    console.log('expand-dotenvx-envs-action')
    console.log({
      privateKey: privateKey.length > 0 ? '[set]' : '[empty]',
      variables,
      expandAll,
    })
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message)
    } else {
      core.setFailed(String(error))
    }
  }
}
