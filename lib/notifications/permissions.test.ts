import assert from 'node:assert/strict';

import {
  canRequestNotificationPermission,
  interpretNotificationPermissions,
  IOS_AUTH,
} from './permissionStatus.ts';

function run(): void {
  assert.equal(
    interpretNotificationPermissions({
      status: 'granted',
      granted: true,
      canAskAgain: false,
    }).state,
    'granted',
    'root granted maps to granted',
  );

  assert.equal(
    interpretNotificationPermissions({
      status: 'denied',
      granted: false,
      canAskAgain: false,
      ios: { status: IOS_AUTH.AUTHORIZED },
    }).state,
    'granted',
    'iOS authorized still counts as granted',
  );

  assert.equal(
    interpretNotificationPermissions({
      status: 'denied',
      granted: false,
      canAskAgain: false,
      ios: { status: IOS_AUTH.PROVISIONAL },
    }).state,
    'granted',
    'iOS provisional counts as granted for local alerts',
  );

  assert.equal(
    interpretNotificationPermissions({
      status: 'undetermined',
      granted: false,
      canAskAgain: true,
    }).state,
    'undetermined',
    'undetermined stays undetermined',
  );

  const androidPrePrompt = interpretNotificationPermissions({
    status: 'denied',
    granted: false,
    canAskAgain: true,
  });
  assert.equal(androidPrePrompt.state, 'denied', 'Android pre-prompt may report denied');
  assert.equal(androidPrePrompt.canAskAgain, true, 'Android pre-prompt can still ask');
  assert.equal(
    canRequestNotificationPermission(androidPrePrompt),
    true,
    'Android pre-prompt should still trigger requestPermissionsAsync',
  );

  const permanent = interpretNotificationPermissions({
    status: 'denied',
    granted: false,
    canAskAgain: false,
  });
  assert.equal(permanent.state, 'denied');
  assert.equal(canRequestNotificationPermission(permanent), false, 'permanent denial cannot ask again');

  assert.equal(
    canRequestNotificationPermission({ state: 'undetermined', canAskAgain: true }),
    true,
  );
  assert.equal(
    canRequestNotificationPermission({ state: 'granted', canAskAgain: false }),
    false,
  );

  console.log('permissions.test.ts passed');
}

run();
