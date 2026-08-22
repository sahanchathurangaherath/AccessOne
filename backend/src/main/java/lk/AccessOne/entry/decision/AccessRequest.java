package lk.AccessOne.entry.decision;

import lk.AccessOne.shared.enums.Direction;

import java.time.LocalDateTime;
import java.time.ZoneOffset;

public record AccessRequest(
        String credentialRef,       // card serial or pass number, as presented
        String areaCode,
        Direction direction,
        LocalDateTime at) {

    public static AccessRequest now(String credentialRef, String areaCode, Direction direction) {
        return new AccessRequest(credentialRef, areaCode, direction, LocalDateTime.now(ZoneOffset.UTC));
    }
}
