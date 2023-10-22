import * as toml from '@iarna/toml'
import * as fs from 'fs'
import * as fsPromise from 'fs/promises'
import * as path from 'path'
import * as yup from 'yup'
import * as dockerNames from 'docker-names'

import { asFormattedEnvironment, asLocalRelative } from 'src/utils/format'
import { getFiles } from '../utils/filesystem'

export const configName = 'e2b.json'

const configCommentHeader = '# This is a config for a e2b environment'

export function randomTitle() {
  return dockerNames.getRandomName().replace('_', '-')
}

export const configSchema = yup.object({
  id: yup.string().required(),
  title: yup.string().default(randomTitle),
})

export type E2bConfig = yup.InferType<typeof configSchema>

export async function loadConfig(configPath: string) {
  try {
    const configExists = fs.existsSync(configPath)
    if (!configExists) {
      throw new Error(`Config on path ${asLocalRelative(configPath)} not found`)
    }

    const tomlRaw = await fsPromise.readFile(configPath, 'utf-8')
    const config = toml.parse(tomlRaw)
    return (await configSchema.validate(config)) as E2bConfig
  } catch (err: any) {
    throw new Error(
      `E2b environment config ${asLocalRelative(configPath)} cannot be loaded: ${err.message
      }`,
    )
  }
}

export async function saveConfig(
  configPath: string,
  config: E2bConfig,
  overwrite?: boolean,
) {
  try {
    if (!overwrite) {
      const configExists = fs.existsSync(configPath)
      if (configExists) {
        throw new Error(`Config already exists on path ${asLocalRelative(configPath)}`)
      }
    }

    const validatedConfig: any = await configSchema.validate(config, {
      stripUnknown: true,
    })

    const tomlRaw = toml.stringify(validatedConfig)
    await fsPromise.writeFile(configPath, configCommentHeader + tomlRaw)
  } catch (err: any) {
    throw new Error(
      `e2b environment config ${asFormattedEnvironment(
        config,
        configPath,
      )} cannot be saved: ${err.message}`,
    )
  }
}

export async function deleteConfig(configPath: string) {
  await fsPromise.unlink(configPath)
}

export function getConfigPath(root: string) {
  return path.join(root, configName)
}

export async function getNestedConfigs(rootPath: string) {
  return getFiles(rootPath, { name: configName })
}

export async function loadConfigs(rootPath: string, nested?: boolean) {
  const configPaths = nested
    ? (await getNestedConfigs(rootPath)).map((c: { path: any }) => c.path)
    : [getConfigPath(rootPath)]

  return Promise.all(
    configPaths.map(async (configPath: string) => {
      const config = await loadConfig(configPath)
      return {
        ...config,
        configPath,
      }
    }),
  )
}
