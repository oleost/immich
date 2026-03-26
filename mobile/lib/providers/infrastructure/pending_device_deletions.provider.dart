import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/repositories/deleted_asset_api.repository.dart';
import 'package:logging/logging.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'pending_device_deletions.provider.g.dart';

@riverpod
class PendingDeviceDeletionsNotifier extends _$PendingDeviceDeletionsNotifier {
  final _log = Logger('PendingDeviceDeletionsNotifier');

  @override
  List<String> build() => [];

  /// Queries the server for device asset IDs that have been permanently
  /// deleted from Immich but not yet acknowledged by this device.
  /// Should be called once at app startup, after the initial sync.
  Future<void> checkForPendingDeletions() async {
    final deviceId = Store.tryGet(StoreKey.deviceId);
    if (deviceId == null || deviceId.isEmpty) return;

    try {
      final repository = ref.read(deletedAssetApiRepositoryProvider);
      final pending = await repository.getPendingDeletions(deviceId);
      state = pending;
    } catch (e, stack) {
      _log.warning('Failed to fetch pending device deletions', e, stack);
    }
  }

  /// Called after the user has responded to the delete dialog (confirmed or
  /// dismissed). Acknowledges all pending IDs so they are not shown again.
  Future<void> acknowledgeAll() async {
    if (state.isEmpty) return;

    final deviceId = Store.tryGet(StoreKey.deviceId);
    if (deviceId == null || deviceId.isEmpty) return;

    try {
      final repository = ref.read(deletedAssetApiRepositoryProvider);
      await repository.acknowledgeDeletions(deviceId, state);
      state = [];
    } catch (e, stack) {
      _log.warning('Failed to acknowledge pending device deletions', e, stack);
      state = [];
    }
  }
}
