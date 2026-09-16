const fs = require("fs");
const path = require("path");
const {
  withDangerousMod,
  withEntitlementsPlist,
  withXcodeProject,
} = require("@expo/config-plugins");

const DEFAULTS = {
  targetName: "PrayerTimesWidgetExtension",
  bundleIdentifier: "com.oummah.app.prayerwidget",
  groupIdentifier: "group.com.oummah.app",
  backgroundAsset: "home-mosque-sunset.jpg",
};

function trimQuotes(value) {
  return String(value || "").replace(/^\"|\"$/g, "");
}

function nativeTarget(project, targetName) {
  const section = project.pbxNativeTargetSection();
  for (const [uuid, target] of Object.entries(section)) {
    if (!uuid.endsWith("_comment") && trimQuotes(target.name) === targetName) {
      return { uuid, pbxNativeTarget: target };
    }
  }
  return null;
}

function ensureGroup(project, groupName) {
  const groups = project.hash.project.objects.PBXGroup;
  for (const [uuid, group] of Object.entries(groups)) {
    if (!uuid.endsWith("_comment") && trimQuotes(group.name) === groupName) return uuid;
  }

  const groupUuid = project.addPbxGroup([], groupName, groupName).uuid;
  const mainGroupUuid = project.getFirstProject().firstProject.mainGroup;
  const mainGroup = project.getPBXGroupByKey(mainGroupUuid);
  mainGroup.children.push({ value: groupUuid, comment: groupName });
  return groupUuid;
}

function configureTarget(project, target, options) {
  const configurations = project.pbxXCConfigurationList()[target.pbxNativeTarget.buildConfigurationList];
  configurations.buildConfigurations.forEach(({ value }) => {
    const buildSettings = project.pbxXCBuildConfigurationSection()[value].buildSettings;
    buildSettings.PRODUCT_BUNDLE_IDENTIFIER = `"${options.bundleIdentifier}"`;
    buildSettings.INFOPLIST_FILE = `"${options.targetName}/Info.plist"`;
    buildSettings.CODE_SIGN_ENTITLEMENTS = `"${options.targetName}/${options.targetName}.entitlements"`;
    buildSettings.APPLICATION_EXTENSION_API_ONLY = "YES";
    buildSettings.IPHONEOS_DEPLOYMENT_TARGET = "16.0";
    buildSettings.SWIFT_VERSION = "5.0";
    buildSettings.TARGETED_DEVICE_FAMILY = "\"1,2\"";
    buildSettings.SKIP_INSTALL = "YES";
  });
}

function configureEmbedPhase(project, targetName) {
  const buildFiles = project.pbxBuildFileSection();
  for (const [uuid, file] of Object.entries(buildFiles)) {
    if (uuid.endsWith("_comment") || file.fileRef_comment !== `${targetName}.appex`) continue;
    file.settings = { ATTRIBUTES: ["CodeSignOnCopy", "RemoveHeadersOnCopy"] };
  }
}

function resourceBuildPhase(project, target) {
  const phases = project.hash.project.objects.PBXResourcesBuildPhase || {};
  const buildPhases = target.pbxNativeTarget.buildPhases || [];
  const resourcePhase = buildPhases.find(({ value }) => phases[value]);
  return resourcePhase ? phases[resourcePhase.value] : null;
}

function addWidgetResource(project, target, groupUuid, filename) {
  const group = project.getPBXGroupByKey(groupUuid);
  const references = project.pbxFileReferenceSection();
  const existingChild = group.children.find(({ value, comment }) => {
    const reference = references[value];
    return comment === filename || trimQuotes(reference?.path).endsWith(`/${filename}`);
  });
  const phase = resourceBuildPhase(project, target);
  const alreadyInResources = phase?.files?.some(({ comment }) => comment === `${filename} in Resources`);

  if (alreadyInResources) return;

  // addResourceFile() assumes that a PBXGroup named "Resources" exists and
  // crashes in Expo-generated projects where resources live in the target
  // group's PBXGroup instead.
  const file = existingChild
    ? { path: filename, basename: filename, fileRef: existingChild.value }
    : project.addFile(filename, groupUuid);
  if (!file) return;

  file.target = target.uuid;
  file.uuid = project.generateUuid();
  project.addToPbxBuildFileSection(file);
  project.addToPbxResourcesBuildPhase(file);
}

function normalizeGroupFileReferences(project, groupUuid, targetName) {
  const group = project.getPBXGroupByKey(groupUuid);
  const references = project.pbxFileReferenceSection();
  const filenames = [
    "PrayerTimesWidget.swift",
    "Info.plist",
    `${targetName}.entitlements`,
  ];

  filenames.forEach((filename) => {
    const child = group.children.find(({ value, comment }) =>
      comment === filename || trimQuotes(references[value]?.path).endsWith(`/${filename}`),
    );
    if (!child) return;

    references[child.value].path = `"${filename}"`;
    references[child.value].sourceTree = '"<group>"';
  });
}

function addWidgetTarget(config, options) {
  return withXcodeProject(config, (config) => {
    const project = config.modResults;
    let target = nativeTarget(project, options.targetName);
    const groupUuid = ensureGroup(project, options.targetName);

    if (!target) {
      target = project.addTarget(options.targetName, "app_extension", options.targetName, options.bundleIdentifier);
      project.addBuildPhase([], "PBXSourcesBuildPhase", "Sources", target.uuid);
      project.addBuildPhase([], "PBXFrameworksBuildPhase", "Frameworks", target.uuid);
      project.addBuildPhase([], "PBXResourcesBuildPhase", "Resources", target.uuid);
      project.addSourceFile("PrayerTimesWidget.swift", { target: target.uuid }, groupUuid);
      project.addFile("Info.plist", groupUuid);
      project.addFile(`${options.targetName}.entitlements`, groupUuid);
      project.addFramework("WidgetKit.framework", { target: target.uuid });
      addWidgetResource(project, target, groupUuid, options.backgroundAsset);
    } else {
      addWidgetResource(project, target, groupUuid, options.backgroundAsset);
    }

    normalizeGroupFileReferences(project, groupUuid, options.targetName);
    configureTarget(project, target, options);
    configureEmbedPhase(project, options.targetName);
    return config;
  });
}

function copyWidgetExtension(config, options) {
  return withDangerousMod(config, ["ios", (config) => {
    const targetDirectory = path.join(config.modRequest.platformProjectRoot, options.targetName);
    const templateDirectory = path.join(__dirname, "widget-extension");
    const projectRoot = config.modRequest.projectRoot;
    const sourceImagePath = path.join(projectRoot, "src", "assets", "images", "home", options.backgroundAsset);
    
    fs.mkdirSync(targetDirectory, { recursive: true });
    fs.copyFileSync(path.join(templateDirectory, "PrayerTimesWidget.swift"), path.join(targetDirectory, "PrayerTimesWidget.swift"));
    fs.copyFileSync(path.join(templateDirectory, "Info.plist"), path.join(targetDirectory, "Info.plist"));
    fs.copyFileSync(path.join(templateDirectory, "PrayerTimesWidgetExtension.entitlements"), path.join(targetDirectory, `${options.targetName}.entitlements`));
    
    if (!fs.existsSync(sourceImagePath)) {
      throw new Error(`Missing widget background asset: ${sourceImagePath}`);
    }

    fs.copyFileSync(sourceImagePath, path.join(targetDirectory, options.backgroundAsset));
    
    return config;
  }]);
}

function withPrayerTimesWidget(config, props = {}) {
  const options = { ...DEFAULTS, ...props };
  config = withEntitlementsPlist(config, (config) => {
    const existing = config.modResults["com.apple.security.application-groups"];
    config.modResults["com.apple.security.application-groups"] = Array.from(new Set([
      ...(Array.isArray(existing) ? existing : []),
      options.groupIdentifier,
    ]));
    return config;
  });
  config = copyWidgetExtension(config, options);
  config = addWidgetTarget(config, options);
  return config;
}

module.exports = withPrayerTimesWidget;
