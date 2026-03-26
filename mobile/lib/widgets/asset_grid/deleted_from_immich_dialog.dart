import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/providers/infrastructure/pending_device_deletions.provider.dart';
import 'package:immich_mobile/services/action.service.dart';

/// Dialog shown at app startup when photos have been permanently deleted from
/// Immich (e.g. on a PC) and the same photos still exist in the local library.
///
/// Gives the user a single, batched prompt rather than interrupting them
/// once per deletion.
class DeletedFromImmichDialog extends ConsumerWidget {
  final List<String> deviceAssetIds;

  const DeletedFromImmichDialog({super.key, required this.deviceAssetIds});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final count = deviceAssetIds.length;

    Future<void> dismiss() async {
      context.pop();
      await ref.read(pendingDeviceDeletionsNotifierProvider.notifier).acknowledgeAll();
    }

    Future<void> deleteFromDevice() async {
      context.pop();
      final actionService = ref.read(actionServiceProvider);
      await actionService.deleteLocal(deviceAssetIds);
      await ref.read(pendingDeviceDeletionsNotifierProvider.notifier).acknowledgeAll();
    }

    return AlertDialog(
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.all(Radius.circular(10))),
      title: Text('deleted_from_immich_dialog_title').tr(),
      content: Text('deleted_from_immich_dialog_content').tr(args: [count.toString()]),
      actions: [
        SizedBox(
          width: double.infinity,
          height: 48,
          child: FilledButton(
            onPressed: dismiss,
            style: FilledButton.styleFrom(
              backgroundColor: context.colorScheme.surfaceDim,
              foregroundColor: context.primaryColor,
            ),
            child: const Text('keep_on_device', style: TextStyle(fontWeight: FontWeight.bold)).tr(),
          ),
        ),
        const SizedBox(height: 8),
        SizedBox(
          width: double.infinity,
          height: 48,
          child: FilledButton(
            onPressed: deleteFromDevice,
            style: FilledButton.styleFrom(backgroundColor: Colors.red[400], foregroundColor: Colors.white),
            child: const Text('delete_from_device', style: TextStyle(fontWeight: FontWeight.bold)).tr(),
          ),
        ),
      ],
    );
  }
}
