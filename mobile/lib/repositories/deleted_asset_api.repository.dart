import 'dart:convert';

import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:http/http.dart' as http;
import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/providers/api.provider.dart';
import 'package:immich_mobile/repositories/api.repository.dart';
import 'package:openapi/api.dart';

final deletedAssetApiRepositoryProvider = Provider(
  (ref) => DeletedAssetApiRepository(
    ref.watch(apiServiceProvider).apiClient,
  ),
);

/// Repository for querying which locally-sourced assets have been permanently
/// deleted from Immich on another device (e.g. PC), so the mobile app can
/// prompt the user to also remove them from their local photo library.
///
/// NOTE: These endpoints are not yet in the generated OpenAPI client.
/// They are called directly via [ApiClient] until the spec is regenerated.
class DeletedAssetApiRepository extends ApiRepository {
  final ApiClient _apiClient;

  const DeletedAssetApiRepository(this._apiClient);

  /// Returns [deviceAssetId]s that were permanently deleted from Immich
  /// for [deviceId] but not yet acknowledged by the device.
  Future<List<String>> getPendingDeletions(String deviceId) async {
    final response = await _apiClient.invokeAPI(
      '/assets/deleted-from-device',
      'GET',
      [QueryParam('deviceId', deviceId)],
      null,
      {},
      {},
      null,
      ['Bearer'],
    );

    if (response.statusCode == 200) {
      final List<dynamic> decoded = jsonDecode(response.body);
      return decoded.cast<String>();
    }
    return [];
  }

  /// Marks [deviceAssetIds] as acknowledged for [deviceId] so they are
  /// not returned by [getPendingDeletions] again.
  Future<void> acknowledgeDeletions(String deviceId, List<String> deviceAssetIds) async {
    if (deviceAssetIds.isEmpty) return;

    await _apiClient.invokeAPI(
      '/assets/deleted-from-device/acknowledge',
      'POST',
      [],
      jsonEncode({'deviceId': deviceId, 'deviceAssetIds': deviceAssetIds}),
      {'Content-Type': 'application/json'},
      {},
      'application/json',
      ['Bearer'],
    );
  }
}
